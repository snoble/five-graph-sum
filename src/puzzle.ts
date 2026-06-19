export const NODE_COUNT = 5;
export const NODE_LABELS = ["A", "B", "C", "D", "E"] as const;
export const TARGET = 30;

/** A directed edge, e.g. from A (0) to B (1). */
export interface Edge {
  readonly from: number;
  readonly to: number;
}

/** The 10 undirected pairs of K5, in canonical (a < b) order. */
export const ALL_PAIRS: ReadonlyArray<readonly [number, number]> = Array.from(
  { length: NODE_COUNT },
  (_, a) => a,
).flatMap((a) =>
  Array.from({ length: NODE_COUNT - a - 1 }, (_, k) => [a, a + 1 + k] as const),
);

/** Stable, direction-independent key for a pair (so AB and BA collide). */
export function pairKey(from: number, to: number): string {
  return from < to ? `${from}-${to}` : `${to}-${from}`;
}

export function reverse(e: Edge): Edge {
  return { from: e.to, to: e.from };
}

/** Default split: all 10 pairs, A→B direction, 5 in each column. */
export function initialColumns(): { left: Edge[]; right: Edge[] } {
  const edges = ALL_PAIRS.map(([a, b]) => ({ from: a, to: b }));
  return { left: edges.slice(0, 5), right: edges.slice(5) };
}

function seededValues(seed: number): number[] {
  return Array.from({ length: NODE_COUNT }, (_, i) => (i === seed ? 1 : 0));
}

/**
 * Node values after applying the first `step` edges from a seed.
 * step = 0 returns the initial state (seed node = 1, others = 0).
 */
export function simulate(
  edges: readonly Edge[],
  seed: number,
  step: number,
): readonly number[] {
  const limit = Math.max(0, Math.min(step, edges.length));
  return edges
    .slice(0, limit)
    .reduce(
      (values, e) =>
        values.map((v, i) => (i === e.to ? v + values[e.from] : v)),
      seededValues(seed),
    );
}

/**
 * How much each edge propagates: the value of its `from` node at the moment it
 * is applied. Indexed parallel to `edges`.
 */
export function propagationAmounts(
  edges: readonly Edge[],
  seed: number,
): readonly number[] {
  return edges.reduce<{ values: number[]; amounts: number[] }>(
    (acc, e) => ({
      values: acc.values.map((v, i) =>
        i === e.to ? v + acc.values[e.from] : v,
      ),
      amounts: [...acc.amounts, acc.values[e.from]],
    }),
    { values: seededValues(seed), amounts: [] },
  ).amounts;
}

export function sumValues(values: readonly number[]): number {
  return values.reduce((s, v) => s + v, 0);
}
