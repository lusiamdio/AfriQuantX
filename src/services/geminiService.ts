/** AI features require an authenticated server-side integration, which is not available yet. */
export type AIResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export interface AIResponse {
  text: string;
  citations?: string[];
}

const unavailable = async <T>(): Promise<AIResult<T>> => ({
  ok: false,
  message: 'AI analysis is currently unavailable.',
});

export const generateFinancialAnalysis = (_prompt: string) => unavailable<AIResponse>();
export const generateStockScreening = (_query: string) => unavailable<any[]>();
export const generateCompanyProfile = (_companyName: string) => unavailable<any>();
export const generateDueDiligenceReport = (_projectName: string) => unavailable<any>();
export const generateAgentLogs = (_context: string) => unavailable<any[]>();
export const generateMarketIntelligence = () => unavailable<any>();
export const generateInvestmentCopilot = (_riskProfile: string) => unavailable<any>();
export const generateTradingSignals = () => unavailable<any>();
export const generateWalletYield = () => unavailable<any>();
