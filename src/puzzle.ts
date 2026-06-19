import { match } from "ts-pattern";

export const NODE_COUNT = 5;
export const NODE_LABELS = ["A", "B", "C", "D", "E"] as const;
export const TARGET = 30;

export type NodeIndex = 0 | 1 | 2 | 3 | 4;

/** A directed edge, e.g. from A (0) to B (1). */
export interface Edge {
  readonly from: number;
  readonly to: number;
}

export type LineErrorKind = "format" | "self-loop" | "duplicate-pair";

export interface LineError {
  readonly kind: LineErrorKind;
  readonly message: string;
}

export interface ParsedLine {
  /** Index of this line within the raw textarea content. */
  readonly lineIndex: number;
  readonly raw: string;
  /** Defined when the line parsed into a mechanically-applicable edge. */
  readonly edge?: Edge;
  readonly error?: LineError;
}

export interface AppliedEdge extends Edge {
  /** Source line index in the textarea. */
  readonly lineIndex: number;
  /** Order in which it is applied, starting at 1. */
  readonly order: number;
}

export interface Parsed {
  readonly lines: readonly ParsedLine[];
  /** Edges that can be mechanically applied, in order. */
  readonly applied: readonly AppliedEdge[];
  /** True when any line has an error (illegal/invalid state). */
  readonly hasError: boolean;
}

interface ParseState {
  readonly lines: readonly ParsedLine[];
  readonly applied: readonly AppliedEdge[];
  readonly seenPairs: ReadonlyMap<string, number>;
  readonly order: number;
}

function letterToIndex(ch: string): number {
  return NODE_LABELS.indexOf(ch as (typeof NODE_LABELS)[number]);
}

/** Unordered pair key so that AB and BA collide. */
function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * Parse raw textarea content into edges plus per-line errors.
 *
 * Blank lines are ignored entirely. Malformed lines are flagged and skipped
 * (cannot be applied). Self-loops are flagged and skipped. Duplicate
 * undirected pairs are flagged on the later occurrence but are still applied
 * mechanically so the visualization keeps moving while you edit.
 */
/** Result of structurally classifying a single token (pre dedupe). */
type LineClass =
  | { tag: "blank" }
  | { tag: "error"; error: LineError }
  | { tag: "edge"; from: number; to: number };

/** Pure, stateless classification. Duplicate-pair detection happens later. */
function classify(token: string): LineClass {
  if (token.length === 0) return { tag: "blank" };
  if (token.length !== 2) {
    return {
      tag: "error",
      error: { kind: "format", message: `Expected two node letters (A–E), e.g. "AB".` },
    };
  }
  const from = letterToIndex(token[0]);
  const to = letterToIndex(token[1]);
  if (from === -1 || to === -1) {
    return {
      tag: "error",
      error: { kind: "format", message: "Unknown node letter. Use only A–E." },
    };
  }
  if (from === to) {
    return {
      tag: "error",
      error: { kind: "self-loop", message: `Self-loop ${token} is not a valid edge.` },
    };
  }
  return { tag: "edge", from, to };
}

export function parse(text: string): Parsed {
  const final = text.split("\n").reduce<ParseState>((state, raw, lineIndex) => {
    const token = raw.replace(/\s+/g, "").toUpperCase();
    const base: ParsedLine = { lineIndex, raw };

    return match(classify(token))
      .with({ tag: "blank" }, () => state) // ignore blank lines silently
      .with({ tag: "error" }, ({ error }) => ({
        ...state,
        lines: [...state.lines, { ...base, error }],
      }))
      .with({ tag: "edge" }, ({ from, to }): ParseState => {
        // Mechanically applicable regardless of duplicate-pair legality.
        const order = state.order + 1;
        const appliedEdge: AppliedEdge = { from, to, lineIndex, order };
        const firstSeen = state.seenPairs.get(pairKey(from, to));

        if (firstSeen !== undefined) {
          const a = NODE_LABELS[Math.min(from, to)];
          const b = NODE_LABELS[Math.max(from, to)];
          return {
            ...state,
            order,
            applied: [...state.applied, appliedEdge],
            lines: [
              ...state.lines,
              {
                ...base,
                edge: { from, to },
                error: {
                  kind: "duplicate-pair",
                  message: `Pair ${a}${b} already used on line ${firstSeen + 1}.`,
                },
              },
            ],
          };
        }

        return {
          order,
          applied: [...state.applied, appliedEdge],
          seenPairs: new Map(state.seenPairs).set(pairKey(from, to), lineIndex),
          lines: [...state.lines, { ...base, edge: { from, to } }],
        };
      })
      .exhaustive();
  }, { lines: [], applied: [], seenPairs: new Map(), order: 0 });

  return {
    lines: final.lines,
    applied: final.applied,
    hasError: final.lines.some((l) => l.error !== undefined),
  };
}

/**
 * Compute node values after applying the first `step` edges from a seed.
 * step = 0 returns the initial state (seed node = 1, others = 0).
 */
export function simulate(
  applied: readonly AppliedEdge[],
  seed: number,
  step: number,
): readonly number[] {
  const limit = Math.max(0, Math.min(step, applied.length));
  const initial: number[] = Array.from({ length: NODE_COUNT }, (_, i) =>
    i === seed ? 1 : 0,
  );
  return applied
    .slice(0, limit)
    .reduce(
      (values, e) =>
        values.map((v, i) => (i === e.to ? v + values[e.from] : v)),
      initial,
    );
}

export function maxValue(values: readonly number[]): number {
  return values.reduce((m, v) => (v > m ? v : m), 0);
}
