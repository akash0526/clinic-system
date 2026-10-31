import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			colors: {
				// Calm clinical teal — used for primary actions and accents.
				brand: {
					50: "#f0fdfa",
					100: "#ccfbf1",
					200: "#99f6e4",
					300: "#5eead4",
					400: "#2dd4bf",
					500: "#14b8a6",
					600: "#0d9488",
					700: "#0f766e",
					800: "#115e59",
					900: "#134e4a",
				},
				// `primary` is kept as an alias so existing screens inherit the theme.
				primary: {
					50: "#f0fdfa",
					100: "#ccfbf1",
					200: "#99f6e4",
					300: "#5eead4",
					400: "#2dd4bf",
					500: "#14b8a6",
					600: "#0d9488",
					700: "#0f766e",
					800: "#115e59",
					900: "#134e4a",
				},
				// Cooler, cleaner neutrals across the whole app.
				gray: colors.slate,
				nepali: {
					red: "#DC143C",
					blue: "#003893",
				},
			},
			fontFamily: {
				sans: [
					"Inter",
					"ui-sans-serif",
					"system-ui",
					"-apple-system",
					"Segoe UI",
					"Roboto",
					"sans-serif",
				],
				nepali: ['"Noto Sans Devanagari"', "sans-serif"],
			},
			borderRadius: {
				"4xl": "2rem",
			},
			boxShadow: {
				soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 14px -6px rgba(15, 23, 42, 0.08)",
				card: "0 1px 3px rgba(15, 23, 42, 0.04), 0 12px 32px -20px rgba(15, 23, 42, 0.28)",
				lift: "0 2px 6px rgba(15, 23, 42, 0.05), 0 18px 44px -22px rgba(15, 23, 42, 0.35)",
				pop: "0 24px 60px -24px rgba(15, 23, 42, 0.4)",
				glow: "0 0 0 4px rgba(13, 148, 136, 0.12)",
			},
			keyframes: {
				"fade-in": {
					from: { opacity: "0" },
					to: { opacity: "1" },
				},
				"fade-in-up": {
					from: { opacity: "0", transform: "translateY(8px)" },
					to: { opacity: "1", transform: "translateY(0)" },
				},
				"scale-in": {
					from: { opacity: "0", transform: "translateY(10px) scale(0.98)" },
					to: { opacity: "1", transform: "translateY(0) scale(1)" },
				},
				"slide-in-left": {
					from: { opacity: "0", transform: "translateX(-12px)" },
					to: { opacity: "1", transform: "translateX(0)" },
				},
				shimmer: {
					"100%": { transform: "translateX(100%)" },
				},
			},
			animation: {
				"fade-in": "fade-in 220ms ease-out both",
				"fade-in-up": "fade-in-up 320ms cubic-bezier(0.22, 1, 0.36, 1) both",
				"scale-in": "scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
				"slide-in-left": "slide-in-left 260ms cubic-bezier(0.22, 1, 0.36, 1) both",
				shimmer: "shimmer 1.6s infinite",
			},
			transitionTimingFunction: {
				smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
			},
		},
	},
	plugins: [],
};
