/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: {
					50: "#eff6ff",
					100: "#dbeafe",
					500: "#3b82f6",
					600: "#2563eb",
					700: "#1d4ed8",
					800: "#1e40af",
					900: "#1e3a8a",
				},
				nepali: {
					red: "#DC143C", // Nepali flag red
					blue: "#003893", // Nepali flag blue
				},
			},
			fontFamily: {
				sans: ["Inter", "system-ui", "sans-serif"],
				nepali: ['"Noto Sans Devanagari"', "sans-serif"],
			},
		},
	},
	plugins: [],
};
