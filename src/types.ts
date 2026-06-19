import { Edge } from "./puzzle";

export interface Ordering {
  id: string;
  name: string;
  /** Index (0–4) of the node that starts at value 1. */
  seed: number;
  /** Edges applied first, top→bottom. */
  left: readonly Edge[];
  /** Edges applied after the left column, top→bottom. */
  right: readonly Edge[];
}
