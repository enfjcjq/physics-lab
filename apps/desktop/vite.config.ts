import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import path from "path";

export default defineConfig({
  base: './',
  plugins: [
    react(),
    electron([
      {
        entry: "src/main/index.ts",
        onstart({ startup }) {
          // 🔧 Fix: Remove ELECTRON_RUN_AS_NODE from env before spawning Electron
          // WorkBuddy sets ELECTRON_RUN_AS_NODE=1 which causes Electron to run in
          // Node.js script mode instead of browser mode, making require('electron')
          // return the exe path string instead of the API object.
          // See: https://github.com/electron/electron/issues/49034
          const cleanEnv = { ...process.env };
          delete cleanEnv.ELECTRON_RUN_AS_NODE;
          startup([".", "--no-sandbox"], { env: cleanEnv });
        },
        vite: {
          build: {
            outDir: "dist-electron/main",
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
      },
      {
        entry: "src/preload/index.ts",
        onstart(args) {
          args.reload();
        },
        vite: {
          build: {
            outDir: "dist-electron/preload",
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  build: {
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks: {
          "three-vendor": ["three", "@react-three/fiber", "@react-three/drei"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/renderer"),
    },
  },
});
