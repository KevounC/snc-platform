import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart(),
  ],
  esbuild: {
    jsx: "automatic",
  },
  server: {
    port: 3001,
    host: "0.0.0.0",
    hmr: {
      clientPort: 3001,
    },
  },
});
