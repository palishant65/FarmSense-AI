import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": "http://127.0.0.1:5000",
      "/uploads": "http://127.0.0.1:5000",
      "/gtts": {
        target: "https://translate.google.com",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/gtts/, "/translate_tts"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36");
            proxyReq.setHeader("Referer", "https://translate.google.com/");
          });
        },
      },
    },
  },
});
