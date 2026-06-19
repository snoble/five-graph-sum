import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Ordering } from "./types";

function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function makeOrdering(name: string): Ordering {
  return { id: makeId(), name, seed: 0, text: "" };
}

interface StoreState {
  orderings: readonly Ordering[];
  add: () => void;
  clone: (id: string) => void;
  remove: (id: string) => void;
  patch: (id: string, fields: Partial<Omit<Ordering, "id">>) => void;
}

/** Immutably apply `fields` to the ordering with the given id. */
function mapOrdering(
  orderings: readonly Ordering[],
  id: string,
  fields: Partial<Omit<Ordering, "id">>,
): readonly Ordering[] {
  return orderings.map((o) => (o.id === id ? { ...o, ...fields } : o));
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      orderings: [makeOrdering("attempt 1")],

      add: () =>
        set((s) => ({
          orderings: [
            ...s.orderings,
            makeOrdering(`attempt ${s.orderings.length + 1}`),
          ],
        })),

      clone: (id) =>
        set((s) => ({
          orderings: s.orderings.flatMap((o) =>
            o.id === id
              ? [o, { ...o, id: makeId(), name: `${o.name} (copy)` }]
              : [o],
          ),
        })),

      remove: (id) =>
        set((s) => {
          const next = s.orderings.filter((o) => o.id !== id);
          return {
            orderings: next.length > 0 ? next : [makeOrdering("attempt 1")],
          };
        }),

      patch: (id, fields) =>
        set((s) => ({ orderings: mapOrdering(s.orderings, id, fields) })),
    }),
    { name: "five-graph-orderings-v1" },
  ),
);
