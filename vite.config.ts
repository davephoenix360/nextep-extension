import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Vite will:
// - use index.html as the popup entry
// - build src/background.ts as background.js in dist/
// - copy public/ (manifest.json) into dist/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: (chunk) => {
          // Emit the background worker exactly where manifest expects it:
          if (chunk.name === "background") {
            return "background.js";
          }
          // Popup bundle (referenced from index.html) and other chunks:
          return "assets/[name].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  publicDir: "public",
});
