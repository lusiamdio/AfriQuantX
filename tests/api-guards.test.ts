import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import routes from '../server/routes/index.js';

let server: Server;
let base: string;
before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  base = `http://127.0.0.1:${address.port}/api`;
});
after(() => server?.close());

for (const path of ['/trade/deposit', '/trade/withdraw', '/trade/execute', '/trade/history', '/bot/start', '/bot/stop', '/bot/status', '/whop/fund-card', '/whop/verify', '/whop/memberships', '/auth/login', '/ai/market-intelligence', '/african/ovex/deposit_address', '/african/ovex/withdraws/create', '/integrations/compliance/screen', '/integrations/custody/settle', '/integrations/oms/route']) {
  test(`${path} fails closed`, async () => {
    for (const method of ['GET', 'POST']) {
      const response = await fetch(base + path, { method });
      assert.equal(response.status, 503);
      assert.equal(typeof (await response.json()).error, 'string');
    }
  });
}
