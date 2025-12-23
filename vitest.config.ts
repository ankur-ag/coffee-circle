import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    pool: "forks", // Use forks instead of threads
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork to avoid cleanup issues
      },
    },
    bail: 1, // Stop on first failure in CI
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
