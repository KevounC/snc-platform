// ── API-level Fixtures (DB row shapes with Date objects for timestamps) ──

export interface MockEmissionRow {
  id: string;
  date: string;
  scope: number;
  category: string;
  subcategory: string;
  source: string;
  description: string;
  amount: number;
  unit: string;
  co2Kg: number;
  method: string;
  projected: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export const makeMockEmissionRow = (
  overrides?: Partial<MockEmissionRow>,
): MockEmissionRow => ({
  id: "13be9694-df8c-4c03-ac72-acde4901563a",
  date: "2026-03-31",
  scope: 2,
  category: "cloud-compute",
  subcategory: "ai-development",
  source: "Claude Code (claude-opus-4-6)",
  description: "March 2026 Claude Code development usage",
  amount: 7704527,
  unit: "tokens",
  co2Kg: 0.034443,
  method: "token-estimate",
  projected: false,
  metadata: {
    inputTokens: 8122,
    outputTokens: 36722,
    costUSD: 4.97,
  },
  createdAt: new Date("2026-03-31T00:00:00.000Z"),
  updatedAt: new Date("2026-03-31T00:00:00.000Z"),
  ...overrides,
});
