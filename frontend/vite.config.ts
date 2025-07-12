import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001", // your backend port
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["framer-motion", "react-icons"],
          "editor-vendor": ["slate", "slate-react"],
          "socket-vendor": ["socket.io-client"],

          // Feature chunks
          auth: [
            "./src/context/AuthContext.tsx",
            "./src/hooks/useAuthApi.ts",
            "./src/hooks/useTokenRefresh.ts",
          ],
          chat: [
            "./src/pages/ChatRoom.tsx",
            "./src/pages/ChatRoomWithUsers.tsx",
            "./src/components/messaging",
          ],
          social: [
            "./src/components/social",
            "./src/api/friends.ts",
            "./src/api/directMessages.ts",
          ],
        },
      },
    },
  },
});
