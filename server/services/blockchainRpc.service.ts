import crypto from 'node:crypto';

export const ALLOWED_MULTICHAIN_NETWORKS = [
  'eth',
  'polygon',
  'bsc',
  'arbitrum',
  'optimism',
  'avalanche',
  'base',
  'fantom',
  'gnosis',
  'linea',
  'scroll',
] as const;

export type MultichainNetwork = (typeof ALLOWED_MULTICHAIN_NETWORKS)[number];

export interface BlockchainHealthStatus {
  configured: boolean;
  connected: boolean;
  mode: 'ANKR_MULTICHAIN_CONNECTED' | 'ADAPTER_READY_UNCONFIGURED' | 'RPC_DEGRADED';
  provider: string;
  host: string | null;
  latencyMs: number;
  chainsReported?: number;
  error?: string;
}

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function resolveRpcUrl(): { rawUrl: string; host: string; isAnkrMultichain: boolean } | null {
  const candidate = (process.env.ANKR_MULTICHAIN_RPC_URL || process.env.BLOCKCHAIN_RPC_URL || '').trim();
  if (!candidate) return null;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    const hostname = parsed.hostname.toLowerCase();
    // Block loopback/link-local metadata targets unless explicitly safe
    if (
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal'
    ) {
      return null;
    }
    return {
      rawUrl: candidate,
      host: parsed.host,
      isAnkrMultichain: hostname.includes('ankr.com') && parsed.pathname.includes('/multichain'),
    };
  } catch {
    return null;
  }
}

export function validateEvmAddress(address: string): string {
  const trimmed = String(address || '').trim();
  if (!EVM_ADDRESS_RE.test(trimmed)) {
    throw new Error('INVALID_EVM_ADDRESS');
  }
  return trimmed;
}

export function sanitizeChains(chainsInput?: string | string[]): MultichainNetwork[] {
  if (!chainsInput) return ['eth', 'polygon', 'base'];
  const list = Array.isArray(chainsInput)
    ? chainsInput
    : String(chainsInput)
        .split(',')
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean);

  const filtered = list.filter((c): c is MultichainNetwork =>
    (ALLOWED_MULTICHAIN_NETWORKS as readonly string[]).includes(c)
  );
  if (filtered.length === 0) {
    throw new Error('UNSUPPORTED_BLOCKCHAIN_NETWORK');
  }
  return Array.from(new Set(filtered)).slice(0, 6);
}

class BlockchainRpcService {
  isConfigured(): boolean {
    return resolveRpcUrl() !== null;
  }

  getSanitizedProviderInfo() {
    const resolved = resolveRpcUrl();
    return {
      configured: resolved !== null,
      provider: resolved?.isAnkrMultichain ? 'Ankr Multichain RPC' : 'EVM JSON-RPC Adapter',
      host: resolved?.host ?? null,
      supportedNetworks: ALLOWED_MULTICHAIN_NETWORKS,
    };
  }

  private async callJsonRpc<T = unknown>(method: string, params: Record<string, unknown> | unknown[]): Promise<T> {
    const resolved = resolveRpcUrl();
    if (!resolved) {
      const err = new Error('BLOCKCHAIN_RPC_NOT_CONFIGURED');
      (err as Error & { statusCode?: number }).statusCode = 503;
      throw err;
    }

    const rpcPayload = {
      jsonrpc: '2.0',
      id: crypto.randomInt(1, 999999),
      method,
      params,
    };

    const response = await fetch(resolved.rawUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rpcPayload),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`RPC_HTTP_${response.status}`);
    }

    const body = (await response.json()) as {
      result?: T;
      error?: { code?: number; message?: string };
    };

    if (body.error) {
      throw new Error(body.error.message || 'RPC_METHOD_ERROR');
    }

    return body.result as T;
  }

  async getHealthStatus(): Promise<BlockchainHealthStatus> {
    const resolved = resolveRpcUrl();
    if (!resolved) {
      return {
        configured: false,
        connected: false,
        mode: 'ADAPTER_READY_UNCONFIGURED',
        provider: 'Ankr Multichain RPC',
        host: null,
        latencyMs: 0,
      };
    }

    const start = Date.now();
    try {
      if (resolved.isAnkrMultichain) {
        const result = await this.callJsonRpc<{ stats?: unknown[] }>('ankr_getBlockchainStats', {
          blockchain: ['eth', 'polygon', 'base'],
        });
        const chainsReported = Array.isArray(result?.stats) ? result.stats.length : 0;
        return {
          configured: true,
          connected: true,
          mode: 'ANKR_MULTICHAIN_CONNECTED',
          provider: 'Ankr Multichain RPC',
          host: resolved.host,
          latencyMs: Math.max(1, Date.now() - start),
          chainsReported,
        };
      }

      await this.callJsonRpc<string>('eth_blockNumber', []);
      return {
        configured: true,
        connected: true,
        mode: 'ANKR_MULTICHAIN_CONNECTED',
        provider: 'EVM JSON-RPC Adapter',
        host: resolved.host,
        latencyMs: Math.max(1, Date.now() - start),
      };
    } catch {
      return {
        configured: true,
        connected: false,
        mode: 'RPC_DEGRADED',
        provider: resolved.isAnkrMultichain ? 'Ankr Multichain RPC' : 'EVM JSON-RPC Adapter',
        host: resolved.host,
        latencyMs: Date.now() - start,
        error: 'Upstream RPC endpoint did not respond cleanly.',
      };
    }
  }

  async getBlockchainStats(chainsInput?: string | string[]) {
    const blockchain = sanitizeChains(chainsInput);
    const result = await this.callJsonRpc<{ stats?: Array<Record<string, unknown>> }>('ankr_getBlockchainStats', {
      blockchain,
    });
    return {
      provider: 'Ankr Multichain RPC',
      networks: blockchain,
      stats: result?.stats ?? [],
      timestamp: new Date().toISOString(),
    };
  }

  async getAccountBalances(walletAddress: string, chainsInput?: string | string[]) {
    const validAddress = validateEvmAddress(walletAddress);
    const blockchain = sanitizeChains(chainsInput);
    const result = await this.callJsonRpc<{
      totalBalanceUsd?: string;
      assets?: Array<Record<string, unknown>>;
    }>('ankr_getAccountBalance', {
      walletAddress: validAddress,
      blockchain,
      onlyWhitelisted: true,
      pageSize: 20,
    });

    return {
      walletAddress: validAddress,
      networks: blockchain,
      totalBalanceUsd: result?.totalBalanceUsd ?? '0',
      assets: result?.assets ?? [],
      timestamp: new Date().toISOString(),
    };
  }

  async getTransactionsByAddress(walletAddress: string, chainsInput?: string | string[]) {
    const validAddress = validateEvmAddress(walletAddress);
    const blockchain = sanitizeChains(chainsInput);
    const result = await this.callJsonRpc<{
      transactions?: Array<Record<string, unknown>>;
    }>('ankr_getTransactionsByAddress', {
      address: validAddress,
      blockchain,
      pageSize: 10,
      descOrder: true,
    });

    return {
      walletAddress: validAddress,
      networks: blockchain,
      transactions: result?.transactions ?? [],
      timestamp: new Date().toISOString(),
    };
  }

  async getTokenHolders(chainInput: string, contractAddress: string) {
    const [blockchain] = sanitizeChains([chainInput]);
    const validContract = validateEvmAddress(contractAddress);
    const result = await this.callJsonRpc<{
      holders?: Array<Record<string, unknown>>;
      holdersCount?: number;
      tokenDecimals?: number;
    }>('ankr_getTokenHolders', {
      blockchain,
      contractAddress: validContract,
      pageSize: 10,
    });

    return {
      blockchain,
      contractAddress: validContract,
      holdersCount: result?.holdersCount ?? 0,
      tokenDecimals: result?.tokenDecimals ?? 18,
      holders: result?.holders ?? [],
      timestamp: new Date().toISOString(),
    };
  }
}

export const blockchainRpcService = new BlockchainRpcService();
