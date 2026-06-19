import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://snoble.github.io/five-graph-sum/, so assets need the
// repo name as the base path in production.
export default defineConfig({
  base: "/five-graph-sum/",
  plugins: [react()],
});
