import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	server: {
		host: "0.0.0.0",
		port: 5173,
		strictPort: false,
		// Allow proxied preview hosts (e.g. *.e2b.app) during development.
		allowedHosts: true,
		proxy: {
			"/api": {
				target: process.env.VITE_PROXY_TARGET || "http://localhost:5000",
				changeOrigin: true,
			},
		},
	},
	preview: {
		host: "0.0.0.0",
		allowedHosts: true,
	},
	build: {
		chunkSizeWarningLimit: 700,
		rollupOptions: {
			output: {
				manualChunks: {
					"vendor-react": ["react", "react-dom", "react-router-dom"],
					"vendor-data": ["@tanstack/react-query", "axios", "zustand"],
					"vendor-ui": ["lucide-react", "react-hot-toast"],
				},
			},
		},
	},
});
