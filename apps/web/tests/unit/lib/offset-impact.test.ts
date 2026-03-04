import { describe, it, expect } from "vitest";

import { computeOffsetImpact } from "../../../src/lib/offset-impact.js";

describe("computeOffsetImpact", () => {
  it("returns empty array for zero kg", () => {
    expect(computeOffsetImpact(0)).toEqual([]);
  });

  it("returns empty array for negative kg", () => {
    expect(computeOffsetImpact(-5)).toEqual([]);
  });

  it("returns 2 cards for positive offset", () => {
    const result = computeOffsetImpact(10);
    expect(result).toHaveLength(2);
  });

  it("computes donation correctly", () => {
    // 1000 kg / 1000 * $30 = $30.00
    const result = computeOffsetImpact(1000);
    const donation = result.find((c) => c.label === "Pika Project donation");
    expect(donation).toBeDefined();
    expect(donation!.value).toBe("$30.00");
    expect(donation!.unit).toBe("USD");
  });

  it("shows sq ft for small offsets", () => {
    // 10 kg → donation = $0.30 → SPLT = $0.24 → acres = 0.0005 → sqft = ~21.78
    const result = computeOffsetImpact(10);
    const grassland = result.find((c) => c.label === "Grassland protected");
    expect(grassland).toBeDefined();
    expect(grassland!.unit).toBe("sq ft");
  });

  it("shows acres for large offsets", () => {
    // 1,000,000 kg → donation = $30,000 → SPLT = $24,000 → acres = 50
    const result = computeOffsetImpact(1_000_000);
    const grassland = result.find((c) => c.label === "Grassland protected");
    expect(grassland).toBeDefined();
    expect(grassland!.unit).toBe("acres");
    expect(Number(grassland!.value)).toBeCloseTo(50, 0);
  });
});
