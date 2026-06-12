import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
