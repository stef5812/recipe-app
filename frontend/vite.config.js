// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => {
  const isBuild = command === "build";

  return {
    plugins: [react()],
    base: "/recipe-app/",

    server: {
      port: 5174,
      host: true,
      proxy: {
        // Recipe backend API
        "/api": {
          target: "http://127.0.0.1:3002",
          changeOrigin: true,
        },
        // If recipe images/uploads are served by backend
        "/uploads": {
          target: "http://127.0.0.1:3002",
          changeOrigin: true,
        },
        // Central auth backend
        "/auth": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: "localhost",
        },
      },
    },

    build: isBuild
      ? {
          outDir: "/var/www/stefandodds.ie/recipe-app",
          emptyOutDir: true,
        }
      : undefined,
  };
});