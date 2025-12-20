import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/contentScript.ts"),
      },
      output: {
        format: "iife",
        entryFileNames: () => "content/content.js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
