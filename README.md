# Five-Graph Puzzle Lab

A small in-browser tool for experimenting with a 5-node directed-edge puzzle.
It does **not** solve the puzzle for you — it just lets you build orderings and
see what they do.

## The puzzle

- 5 nodes: **A, B, C, D, E** (a full graph = the pentagon + the inner star, so
  10 possible undirected edges).
- One **seed** node starts at value `1`; every other node starts at `0`.
- You apply **directed edges in order**. Applying `AB` does `B += A` (the
  `from` node is unchanged, its value is added to the `to` node).
- Each **undirected pair** can be used at most once: using `AB` blocks both
  `AB` and `BA` later.
- **Goal:** get the highest node value to `30`.

## Using the app

- Each card is one **ordering**. Type one edge per line, e.g.

  ```
  AB
  BC
  CA
  ```

- Pick the **seed** node (the one that starts at `1`).
- Drag the **scrubber** to step through the ordering and watch values
  propagate. Applied edges are drawn with direction arrows and an order number.
- **Illegal states are allowed while editing** (duplicate pairs, self-loops,
  malformed lines). They're flagged with a red border and an error list, but the
  app keeps simulating the mechanically-applicable edges so you can keep moving.
- **Clone** an ordering to branch from it; **+ New ordering** for a blank one.
- Orderings persist to `localStorage`.

## Tech

- React + TypeScript + Vite
- [zustand](https://github.com/pmndrs/zustand) for the central state store
  (with `persist` to `localStorage`)
- [ts-pattern](https://github.com/gvergnaud/ts-pattern) for parsing/classifying
  edge lines
- Pure, immutable puzzle logic in `src/puzzle.ts`

## Develop

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```
