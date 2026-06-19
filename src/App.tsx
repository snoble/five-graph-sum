import { OrderingCard } from "./components/OrderingCard";
import { TARGET } from "./puzzle";
import { useStore } from "./store";

export default function App() {
  const orderings = useStore((s) => s.orderings);
  const add = useStore((s) => s.add);
  const clone = useStore((s) => s.clone);
  const remove = useStore((s) => s.remove);
  const patch = useStore((s) => s.patch);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Five-Graph Puzzle Lab</h1>
          <p className="subtitle">
            5 nodes, directed edges applied in order (<code>to += from</code>).
            Each undirected pair usable once. Get a node to {TARGET}.
          </p>
        </div>
        <button className="primary" onClick={add}>
          + New ordering
        </button>
      </header>

      <main className="grid">
        {orderings.map((o) => (
          <OrderingCard
            key={o.id}
            ordering={o}
            onPatch={(fields) => patch(o.id, fields)}
            onClone={() => clone(o.id)}
            onDelete={() => remove(o.id)}
          />
        ))}
      </main>
    </div>
  );
}
