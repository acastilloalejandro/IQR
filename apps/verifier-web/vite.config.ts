import { defineConfig } from "vite";

export default defineConfig({
  root: "apps/verifier-web",
  base: "/IQR/",
  build: { outDir: "../../dist-web", emptyOutDir: true }
});