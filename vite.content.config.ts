import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist", // ✅ same output folder
    emptyOutDir: false, // ✅ don't wipe what the main build produced
    sourcemap: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/contentScript.ts"),
      },
      output: {
        // ✅ build as a single IIFE bundle so there are no top-level imports
        format: "iife",
        entryFileNames: () => "content/content.js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
