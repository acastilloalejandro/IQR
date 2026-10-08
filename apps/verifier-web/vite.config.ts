import { defineConfig } from "vite";
export default defineConfig({
  root: "apps/verifier-web",
  build: { outDir: "../../dist-web", emptyOutDir: true }
});