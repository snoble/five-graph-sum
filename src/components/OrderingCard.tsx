import { useState } from "react";
import { Ordering } from "../types";
import {
  Edge,
  NODE_LABELS,
  TARGET,
  propagationAmounts,
  simulate,
  sumValues,
} from "../puzzle";
import { GraphView } from "./GraphView";
import { EdgeEditor } from "./EdgeEditor";

interface OrderingCardProps {
  ordering: Ordering;
  onPatch: (fields: Partial<Omit<Ordering, "id">>) => void;
  onClone: () => void;
  onDelete: () => void;
}

export function OrderingCard({
  ordering,
  onPatch,
  onClone,
  onDelete,
}: OrderingCardProps) {
  const sequence: readonly Edge[] = [...ordering.left, ...ordering.right];
  const total = sequence.length;

  // Raw scrubber position. Default (Infinity) pins to the final state and keeps
  // following the end; once the user scrubs, it sticks. Clamp on read.
  const [rawStep, setStep] = useState(Number.POSITIVE_INFINITY);
  const step = Math.min(rawStep, total);

  const values = simulate(sequence, ordering.seed, step);
  const finalValues = simulate(sequence, ordering.seed, total);
  const amounts = propagationAmounts(sequence, ordering.seed);
  const sum = sumValues(finalValues);
  const won = sum === TARGET;
  const overshot = sum > TARGET;

  const currentEdge = step > 0 ? sequence[step - 1] : null;
  const changedNode = currentEdge ? currentEdge.to : null;

  return (
    <section className="card">
      <header className="card-header">
        <input
          className="name-input"
          name={`name-${ordering.id}`}
          value={ordering.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          aria-label="Ordering name"
        />
        <div className="card-actions">
          <button onClick={onClone} title="Clone this ordering">
            Clone
          </button>
          <button
            className="danger"
            onClick={onDelete}
            title="Delete this ordering"
          >
            Delete
          </button>
        </div>
      </header>

      <div className="seed-row">
        <span className="seed-label">Seed (=1):</span>
        {NODE_LABELS.map((label, i) => (
          <button
            key={label}
            className={`seed-btn${ordering.seed === i ? " active" : ""}`}
            onClick={() => onPatch({ seed: i })}
          >
            {label}
          </button>
        ))}
      </div>

      <GraphView
        edges={sequence}
        step={step}
        values={values}
        finalValues={finalValues}
        amounts={amounts}
        seed={ordering.seed}
        changedNode={changedNode}
      />

      <div className="scrubber">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          aria-label="Previous step"
        >
          ‹
        </button>
        <input
          type="range"
          min={0}
          max={total}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
        />
        <button
          onClick={() => setStep(Math.min(total, step + 1))}
          disabled={step === total}
          aria-label="Next step"
        >
          ›
        </button>
      </div>
      <div className="step-info">
        Step {step} / {total}
        {currentEdge && (
          <span className="edge-tag">
            {NODE_LABELS[currentEdge.from]}→{NODE_LABELS[currentEdge.to]}
          </span>
        )}
      </div>

      <EdgeEditor
        left={ordering.left}
        right={ordering.right}
        amounts={amounts}
        onChange={(left, right) => onPatch({ left, right })}
      />

      <div className="stats">
        <span className={`max-pill${won ? " win" : overshot ? " over" : ""}`}>
          sum {sum} / {TARGET}
          {won && " ✓"}
          {overshot && " (over)"}
        </span>
      </div>
    </section>
  );
}
