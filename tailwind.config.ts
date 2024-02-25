import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config