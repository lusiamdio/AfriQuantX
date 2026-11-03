import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CompanyOnboarding } from '../src/components/CompanyOnboarding.js';
import {
  generateFinancialAnalysis, generateStockScreening, generateCompanyProfile,
  generateDueDiligenceReport, generateAgentLogs, generateMarketIntelligence,
  generateInvestmentCopilot, generateTradingSignals, generateWalletYield,
} from '../src/services/geminiService.js';

test('AI services report unavailable without sending user data', async () => {
  const previousFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected network request'); };
  try {
    const responses = await Promise.all([
      generateFinancialAnalysis('private prompt'), generateStockScreening('query'),
      generateCompanyProfile('company'), generateDueDiligenceReport('project'),
      generateAgentLogs('context'), generateMarketIntelligence(),
      generateInvestmentCopilot('moderate'), generateTradingSignals(), generateWalletYield(),
    ]);
    for (const result of responses) assert.deepEqual(result, { ok: false, message: 'AI analysis is currently unavailable.' });
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('company onboarding offers no simulated verification or submission', () => {
  const html = renderToStaticMarkup(createElement(CompanyOnboarding, { onBack: () => {}, setActiveTab: () => {} }));
  assert.match(html, /Company onboarding unavailable/);
  assert.doesNotMatch(html, /<form|type="file"|Verification Complete|Verified Company/);
});
