import { ALL_PAIRS, Edge, NODE_COUNT, NODE_LABELS, pairKey } from "../puzzle";

interface GraphViewProps {
  /** Edges in application order. */
  edges: readonly Edge[];
  step: number;
  /** Node values at the current scrub step. */
  values: readonly number[];
  /** Node values after every edge is applied. */
  finalValues: readonly number[];
  /** Amount each edge propagates, indexed parallel to `edges`. */
  amounts: readonly number[];
  seed: number;
  /** Node index whose value just changed at the current step, if any. */
  changedNode: number | null;
  /** pairKey of the currently selected edge, if any. */
  selectedId: string | null;
  onSelectEdge: (id: string) => void;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 120;
const NODE_R = 24;

function nodePos(i: number): { x: number; y: number } {
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

export function GraphView({
  edges,
  step,
  values,
  finalValues,
  amounts,
  seed,
  changedNode,
  selectedId,
  onSelectEdge,
}: GraphViewProps) {
  const positions = NODE_LABELS.map((_, i) => nodePos(i));
  const visibleEdges = edges.slice(0, step);

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

      {/* Applied edges, with direction + order: +amount label */}
      {visibleEdges.map((e, idx) => {
        const seg = trimToNodes(positions[e.from], positions[e.to]);
        const mx = (seg.x1 + seg.x2) / 2;
        const my = (seg.y1 + seg.y2) / 2;
        const order = idx + 1;
        const isLast = order === step;
        const id = pairKey(e.from, e.to);
        const selected = id === selectedId;
        const label = `${order}: +${amounts[idx] ?? 0}`;
        const w = label.length * 6.2 + 8;
        const lineClass = ["edge-active"];
        if (isLast) lineClass.push("edge-last");
        if (selected) lineClass.push("edge-selected");
        return (
          <g
            key={`a-${id}`}
            className="edge-group"
            onClick={() => onSelectEdge(id)}
          >
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              className="edge-hit"
            />
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              className={lineClass.join(" ")}
              markerEnd="url(#arrow)"
            />
            <rect
              x={mx - w / 2}
              y={my - 8}
              width={w}
              height={16}
              rx={8}
              className={`edge-label-bg${isLast ? " edge-label-last" : ""}${
                selected ? " edge-label-selected" : ""
              }`}
            />
            <text x={mx} y={my} className="edge-label-text">
              {label}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {positions.map((p, i) => {
        const classes = ["node"];
        if (i === seed) classes.push("node-seed");
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
