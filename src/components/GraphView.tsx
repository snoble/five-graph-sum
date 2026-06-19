import { AppliedEdge, NODE_COUNT, NODE_LABELS, TARGET } from "../puzzle";

interface GraphViewProps {
  applied: readonly AppliedEdge[];
  step: number;
  /** Node values at the current scrub step. */
  values: readonly number[];
  /** Node values after every edge is applied. */
  finalValues: readonly number[];
  seed: number;
  /** Node index whose value just changed at the current step, if any. */
  changedNode: number | null;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 120;
const NODE_R = 24;

function nodePos(i: number): { x: number; y: number } {
  // Start at top, go clockwise.
  const angle = (-90 + i * (360 / NODE_COUNT)) * (Math.PI / 180);
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

/** Shorten a segment so it stops at the node circle boundary. */
function trimToNodes(
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: from.x + ux * NODE_R,
    y1: from.y + uy * NODE_R,
    x2: to.x - ux * NODE_R,
    y2: to.y - uy * NODE_R,
  };
}

const ALL_PAIRS: ReadonlyArray<readonly [number, number]> = Array.from(
  { length: NODE_COUNT },
  (_, a) => a,
).flatMap((a) =>
  Array.from(
    { length: NODE_COUNT - a - 1 },
    (_, k) => [a, a + 1 + k] as const,
  ),
);

export function GraphView({
  applied,
  step,
  values,
  finalValues,
  seed,
  changedNode,
}: GraphViewProps) {
  const positions = NODE_LABELS.map((_, i) => nodePos(i));
  const visibleEdges = applied.slice(0, step);
  const maxVal = values.reduce((m, v) => (v > m ? v : m), 0);

  return (
    <svg
      className="graph"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="Pentagon graph of node values"
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--edge-active)" />
        </marker>
      </defs>

      {/* Faint potential edges (pentagon + star) */}
      {ALL_PAIRS.map(([a, b]) => {
        const seg = trimToNodes(positions[a], positions[b]);
        return (
          <line
            key={`p-${a}-${b}`}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            className="edge-potential"
          />
        );
      })}

      {/* Applied edges, with direction + order label */}
      {visibleEdges.map((e) => {
        const seg = trimToNodes(positions[e.from], positions[e.to]);
        const mx = (seg.x1 + seg.x2) / 2;
        const my = (seg.y1 + seg.y2) / 2;
        const isLast = e.order === step;
        return (
          <g key={`a-${e.lineIndex}-${e.order}`}>
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              className={isLast ? "edge-active edge-last" : "edge-active"}
              markerEnd="url(#arrow)"
            />
            <circle cx={mx} cy={my} r={9} className="edge-order-bg" />
            <text x={mx} y={my} className="edge-order-text">
              {e.order}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {positions.map((p, i) => {
        const isMax = values[i] === maxVal && maxVal > 0;
        const hitTarget = values[i] === TARGET;
        const classes = ["node"];
        if (i === seed) classes.push("node-seed");
        if (isMax) classes.push("node-max");
        if (hitTarget) classes.push("node-target");
        if (i === changedNode) classes.push("node-changed");
        return (
          <g key={`n-${i}`} className={classes.join(" ")}>
            <circle cx={p.x} cy={p.y} r={NODE_R} />
            <text x={p.x} y={p.y - 9} className="node-label">
              {NODE_LABELS[i]}
            </text>
            <text x={p.x} y={p.y + 3} className="node-value">
              {values[i]}
            </text>
            <text x={p.x} y={p.y + 14} className="node-final">
              /{finalValues[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
