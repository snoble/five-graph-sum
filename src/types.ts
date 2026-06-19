export interface Ordering {
  id: string;
  name: string;
  /** Index (0–4) of the node that starts at value 1. */
  seed: number;
  /** Raw textarea content: one edge per line. */
  text: string;
}
