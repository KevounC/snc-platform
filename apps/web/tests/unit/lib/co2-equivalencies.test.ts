import { describe, it, expect } from "vitest";

import { computeEquivalencies } from "../../../src/lib/co2-equivalencies.js";

describe("computeEquivalencies", () => {
  it("returns empty array for zero kg", () => {
    expect(computeEquivalencies(0)).toEqual([]);
  });

  it("returns empty array for negative kg", () => {
    expect(computeEquivalencies(-1)).toEqual([]);
  });

  it("returns 4 equivalency items for positive kg", () => {
    const result = computeEquivalencies(10);
    expect(result).toHaveLength(4);
  });

  it("computes miles driven correctly", () => {
    // 10 kg / 0.404 kg/mile ≈ 24.75 miles
    const result = computeEquivalencies(10);
    const milesDriven = result.find((r) => r.label === "Miles driven");
    expect(milesDriven).toBeDefined();
    expect(Number(milesDriven!.value)).toBeCloseTo(24.75, 0);
    expect(milesDriven!.unit).toBe("miles");
  });

  it("computes smartphone charges correctly", () => {
    // 10 kg / 0.00822 kg/charge ≈ 1216.5
    const result = computeEquivalencies(10);
    const charges = result.find((r) => r.label === "Smartphone charges");
    expect(charges).toBeDefined();
    expect(Number(charges!.value.replace(",", ""))).toBeCloseTo(1216.5, -1);
    expect(charges!.unit).toBe("charges");
  });

  it("uses hours for small US footprint values", () => {
    // 0.5 kg / 44.16 kg/day = 0.011 days → ~0.27 hours → ~16 minutes
    const result = computeEquivalencies(0.5);
    const us = result.find((r) => r.label === "Avg US footprint");
    expect(us).toBeDefined();
    expect(us!.unit).toBe("minutes");
  });

  it("uses days for larger values", () => {
    // 100 kg / 44.16 kg/day ≈ 2.26 days
    const result = computeEquivalencies(100);
    const us = result.find((r) => r.label === "Avg US footprint");
    expect(us).toBeDefined();
    expect(us!.unit).toBe("days");
  });

  it("does not include tree seedlings", () => {
    const result = computeEquivalencies(60);
    const trees = result.find((r) => r.label === "Tree seedlings (10 yr)");
    expect(trees).toBeUndefined();
  });
});
