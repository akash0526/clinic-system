import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.ico", "icons/*.png"],
			manifest: {
				name: "Clinic Management System",
				short_name: "ClinicMS",
				description: "Nepal Clinic Management System",
				theme_color: "#1e40af",
				background_color: "#ffffff",
				display: "standalone",
				icons: [
					{ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
					{ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/api\./i,
						handler: "NetworkFirst",
						options: { cacheName: "api-cache", networkTimeoutSeconds: 10 },
					},
				],
			},
		}),
	],
	server: {
		proxy: {
			"/api": { target: "http://localhost:5000", changeOrigin: true },
		},
	},
});
