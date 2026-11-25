import { createClient, type RedisClientType } from 'redis';

export interface RedisHealthStatus {
  configured: boolean;
  connected: boolean;
  mode: 'REDIS_CONNECTED' | 'IN_MEMORY_FALLBACK' | 'REDIS_DEGRADED';
  latencyMs: number;
  endpoint: string | null;
  error?: string;
}

interface RedisResolvedConfig {
  url: string;
  sanitizedEndpoint: string;
  useTls: boolean;
}

const PREFIX = 'aqx:';

function resolveRedisConfig(): RedisResolvedConfig | null {
  const rawUrl = (process.env.REDIS_URL || '').trim();
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
        return null;
      }
      const host = parsed.hostname;
      const port = parsed.port || '6379';
      return {
        url: rawUrl,
        sanitizedEndpoint: `${host}:${port}`,
        useTls: parsed.protocol === 'rediss:' || process.env.REDIS_TLS === 'true',
      };
    } catch {
      return null;
    }
  }

  const host = (process.env.REDIS_HOST || '').trim();
  const port = (process.env.REDIS_PORT || '6379').trim();
  const username = (process.env.REDIS_USERNAME || 'default').trim();
  const password = (process.env.REDIS_PASSWORD || '').trim();
  const useTls = process.env.REDIS_TLS === 'true';

  if (!host || !/^[a-zA-Z0-9.-]+$/.test(host) || !/^\d+$/.test(port)) {
    return null;
  }

  const scheme = useTls ? 'rediss' : 'redis';
  const authPart = password
    ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
    : '';

  return {
    url: `${scheme}://${authPart}${host}:${port}`,
    sanitizedEndpoint: `${host}:${port}`,
    useTls,
  };
}

function sanitizeKey(key: string): string {
  const cleaned = key.replace(/[^a-zA-Z0-9:_-]/g, '_').slice(0, 128);
  return `${PREFIX}${cleaned}`;
}

class RedisService {
  private client: RedisClientType | null = null;
  private connectingPromise: Promise<RedisClientType | null> | null = null;
  private memoryFallback = new Map<string, { value: string; expiresAt: number | null }>();
  private lastConfigUrl: string | null = null;

  isConfigured(): boolean {
    return resolveRedisConfig() !== null;
  }

  getSanitizedEndpoint(): string | null {
    return resolveRedisConfig()?.sanitizedEndpoint ?? null;
  }

  private async getClient(): Promise<RedisClientType | null> {
    const cfg = resolveRedisConfig();
    if (!cfg) {
      return null;
    }

    if (this.client && this.client.isReady && this.lastConfigUrl === cfg.url) {
      return this.client;
    }

    if (this.connectingPromise && this.lastConfigUrl === cfg.url) {
      return this.connectingPromise;
    }

    this.lastConfigUrl = cfg.url;
    this.connectingPromise = (async () => {
      try {
        if (this.client) {
          try {
            await this.client.quit();
          } catch {
            // Ignore cleanup failure
          }
          this.client = null;
        }

        const client: RedisClientType = createClient({
          url: cfg.url,
          socket: {
            connectTimeout: 5000,
            reconnectStrategy: (retries) => (retries > 2 ? false : Math.min(retries * 200, 1000)),
          },
        });

        client.on('error', () => {
          // Swallow noisy runtime logs so credentials or sockets never leak
        });

        await client.connect();
        this.client = client;
        return client;
      } catch {
        this.client = null;
        return null;
      } finally {
        this.connectingPromise = null;
      }
    })();

    return this.connectingPromise;
  }

  async ping(): Promise<RedisHealthStatus> {
    const cfg = resolveRedisConfig();
    if (!cfg) {
      return {
        configured: false,
        connected: false,
        mode: 'IN_MEMORY_FALLBACK',
        latencyMs: 1,
        endpoint: null,
      };
    }

    const start = Date.now();
    try {
      const client = await this.getClient();
      if (!client) {
        return {
          configured: true,
          connected: false,
          mode: 'REDIS_DEGRADED',
          latencyMs: Date.now() - start,
          endpoint: cfg.sanitizedEndpoint,
          error: 'Unable to establish Redis connection.',
        };
      }
      const pong = await client.ping();
      return {
        configured: true,
        connected: pong === 'PONG',
        mode: pong === 'PONG' ? 'REDIS_CONNECTED' : 'REDIS_DEGRADED',
        latencyMs: Math.max(1, Date.now() - start),
        endpoint: cfg.sanitizedEndpoint,
      };
    } catch {
      return {
        configured: true,
        connected: false,
        mode: 'REDIS_DEGRADED',
        latencyMs: Date.now() - start,
        endpoint: cfg.sanitizedEndpoint,
        error: 'Redis ping check failed.',
      };
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const safeKey = sanitizeKey(key);
    const client = await this.getClient();
    if (client) {
      try {
        const raw = await client.get(safeKey);
        if (typeof raw !== 'string' || !raw) return null;
        return JSON.parse(raw) as T;
      } catch {
        // Fall through to in-memory fallback
      }
    }

    const mem = this.memoryFallback.get(safeKey);
    if (!mem) return null;
    if (mem.expiresAt !== null && Date.now() > mem.expiresAt) {
      this.memoryFallback.delete(safeKey);
      return null;
    }
    try {
      return JSON.parse(mem.value) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    const safeKey = sanitizeKey(key);
    const serialized = JSON.stringify(value);
    const expiresAt = typeof ttlSeconds === 'number' && ttlSeconds > 0
      ? Date.now() + ttlSeconds * 1000
      : null;

    this.memoryFallback.set(safeKey, { value: serialized, expiresAt });

    const client = await this.getClient();
    if (!client) return false;

    try {
      if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
        await client.set(safeKey, serialized, { EX: Math.floor(ttlSeconds) });
      } else {
        await client.set(safeKey, serialized);
      }
      return true;
    } catch {
      return false;
    }
  }

  async del(key: string): Promise<void> {
    const safeKey = sanitizeKey(key);
    this.memoryFallback.delete(safeKey);
    const client = await this.getClient();
    if (!client) return;
    try {
      await client.del(safeKey);
    } catch {
      // Ignore cleanup failure
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // Ignore disconnect error
      }
      this.client = null;
    }
  }
}

export const redisService = new RedisService();
