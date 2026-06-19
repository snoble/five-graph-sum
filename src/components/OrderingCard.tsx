import { useState } from "react";
import { Ordering } from "../types";
import {
  NODE_LABELS,
  TARGET,
  maxValue,
  parse,
  simulate,
} from "../puzzle";
import { GraphView } from "./GraphView";

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
  const parsed = parse(ordering.text);
  const total = parsed.applied.length;

  // Raw scrubber position; clamp on read so edits to the text can't push it
  // out of range. No effect needed -- this is just derived state.
  const [rawStep, setStep] = useState(total);
  const step = Math.min(rawStep, total);

  const values = simulate(parsed.applied, ordering.seed, step);
  const finalValues = simulate(parsed.applied, ordering.seed, total);
  const max = maxValue(finalValues);
  const won = finalValues.some((v) => v === TARGET);
  const overshot = max > TARGET;

  const currentEdge = step > 0 ? parsed.applied[step - 1] : null;
  const changedNode = currentEdge ? currentEdge.to : null;

  const errors = parsed.lines.filter((l) => l.error);

  return (
    <section className={`card${parsed.hasError ? " card-error" : ""}`}>
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
        applied={parsed.applied}
        step={step}
        values={values}
        finalValues={finalValues}
        seed={ordering.seed}
        changedNode={changedNode}
      />

      <div className="scrubber">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
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
          onClick={() => setStep((s) => Math.min(total, s + 1))}
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

      <textarea
        className={`edges-input${parsed.hasError ? " has-error" : ""}`}
        name={`edges-${ordering.id}`}
        value={ordering.text}
        spellCheck={false}
        placeholder={"One edge per line, e.g.\nAB\nBC\nCA"}
        onChange={(e) => onPatch({ text: e.target.value })}
        rows={8}
      />

      <div className="stats">
        <span className={`max-pill${won ? " win" : overshot ? " over" : ""}`}>
          max {max} / {TARGET}
          {won && " ✓"}
          {overshot && " (over)"}
        </span>
        {parsed.hasError && (
          <span className="error-pill">illegal state</span>
        )}
      </div>

      {errors.length > 0 && (
        <ul className="error-list">
          {errors.map((l) => (
            <li key={l.lineIndex}>
              Line {l.lineIndex + 1}: {l.error!.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
