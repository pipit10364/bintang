import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Build ke Vercel: nitro mendeteksi Vercel otomatis saat build di sana.
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      // Pakai src/server.ts (pembungkus halaman error) sebagai server entry.
      server: { entry: "server" },
    }),
    nitro(),
    viteReact(),
    tailwindcss(),
  ],
});
