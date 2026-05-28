import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Blanko",
        short_name: "Blanko",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/pwa-icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "@base-ui/react/button",
      "@base-ui/react/input",
      "@base-ui/react/merge-props",
      "@base-ui/react/separator",
      "@base-ui/react/toggle",
      "@base-ui/react/toggle-group",
      "@base-ui/react/use-render",
    ],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    tsconfigPaths: true,
  },
});
