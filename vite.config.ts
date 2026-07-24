import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  // E2E（playwright.config.ts）とGoogle OAuthのリダイレクトURIが3000番を前提にしている
  server: {
    port: 3000,
    strictPort: true,
  },
  plugins: [
    // Cloudflareプラグインを最初に置き、SSR環境をworkerdランタイム上で動かす
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
