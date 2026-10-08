import { describe, expect, it } from "vitest";
import { analyze, quartiles } from "./robust";

describe("robust statistics", () => {
  it("calculates quartiles and IQR deterministically", () => {
    expect(quartiles([1,2,3,4,5,6,7,8,9])).toEqual({ q1: 3, median: 5, q3: 7, iqr: 4 });
  });

  it("flags 100 as a mild outlier", () => {
    const r = analyze([10,11,12,12,13,14,15,16,100]);
    expect(r.outliers.map(x => x.value)).toEqual([100]);
    expect(r.outliers[0].severity).toBe("extreme");
  });

  it("does not fabricate confidence for tiny samples", () => {
    expect(analyze([1, 2, 100]).limitations.some(x => x.includes("Muestra pequeña"))).toBe(true);
  });

  it("handles constant data without dividing by zero", () => {
    const r = analyze([5,5,5,5]);
    expect(r.iqr).toBe(0);
    expect(r.outliers).toHaveLength(0);
    expect(r.limitations.some(x => x.includes("IQR = 0"))).toBe(true);
  });
});
