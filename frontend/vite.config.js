import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@admin": path.resolve(__dirname, "src/adminPanel"),
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },

  server: {
    port: 5173,
    open: false, // إذا بدك يفتح المتصفح تلقائياً خليها true
  },
});
