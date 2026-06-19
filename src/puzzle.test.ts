import { describe, expect, it } from "vitest";
import {
  ALL_PAIRS,
  Edge,
  initialColumns,
  pairKey,
  propagationAmounts,
  reverse,
  simulate,
  sumValues,
} from "./puzzle";

describe("ALL_PAIRS", () => {
  it("is the 10 unordered pairs of K5 in canonical (a < b) order", () => {
    expect(ALL_PAIRS).toHaveLength(10);
    expect(ALL_PAIRS.every(([a, b]) => a < b)).toBe(true);
    const keys = new Set(ALL_PAIRS.map(([a, b]) => pairKey(a, b)));
    expect(keys.size).toBe(10);
  });
});

describe("pairKey", () => {
  it("is direction-independent so AB and BA collide", () => {
    expect(pairKey(0, 1)).toBe(pairKey(1, 0));
    expect(pairKey(2, 4)).not.toBe(pairKey(2, 3));
  });
});

describe("reverse", () => {
  it("swaps from and to", () => {
    expect(reverse({ from: 1, to: 3 })).toEqual({ from: 3, to: 1 });
  });
});

describe("initialColumns", () => {
  it("splits all 10 pairs into two columns of 5, directed a -> b", () => {
    const { left, right } = initialColumns();
    expect(left).toHaveLength(5);
    expect(right).toHaveLength(5);
    const all = [...left, ...right];
    expect(all.every((e) => e.from < e.to)).toBe(true);
    expect(new Set(all.map((e) => pairKey(e.from, e.to))).size).toBe(10);
  });
});

describe("simulate", () => {
  it("step 0 returns the seeded initial state", () => {
    expect(simulate([], 2, 0)).toEqual([0, 0, 1, 0, 0]);
  });

  it("applies to += from for a single edge", () => {
    // seed A(0)=1, apply A->B: B += A
    expect(simulate([{ from: 0, to: 1 }], 0, 1)).toEqual([1, 1, 0, 0, 0]);
  });

  it("leaves the from node unchanged", () => {
    const values = simulate(
      [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
      ],
      0,
      2,
    );
    expect(values).toEqual([1, 1, 1, 0, 0]);
  });

  it("clamps step to [0, edges.length]", () => {
    const edges: Edge[] = [{ from: 0, to: 1 }];
    expect(simulate(edges, 0, -5)).toEqual([1, 0, 0, 0, 0]);
    expect(simulate(edges, 0, 99)).toEqual(simulate(edges, 0, 1));
  });

  it("computes the default ordering's final state (Fibonacci-ish growth)", () => {
    const { left, right } = initialColumns();
    const seq = [...left, ...right];
    const final = simulate(seq, 0, seq.length);
    expect(final).toEqual([1, 1, 2, 4, 8]);
    expect(sumValues(final)).toBe(16);
  });
});

describe("propagationAmounts", () => {
  it("records each from-node's value at the moment its edge fires", () => {
    const { left, right } = initialColumns();
    const seq = [...left, ...right];
    expect(propagationAmounts(seq, 0)).toEqual([1, 1, 1, 1, 1, 1, 1, 2, 2, 4]);
  });

  it("is empty for no edges", () => {
    expect(propagationAmounts([], 0)).toEqual([]);
  });
});

describe("sumValues", () => {
  it("sums all node values", () => {
    expect(sumValues([1, 1, 2, 4, 8])).toBe(16);
    expect(sumValues([])).toBe(0);
  });
});
