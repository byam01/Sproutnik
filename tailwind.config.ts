import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f0f7f2",
          100: "#dbeef0",
          200: "#b9dec9",
          300: "#8cc6a4",
          400: "#5ea880",
          500: "#3d8b63",
          600: "#2d6f4d",
          700: "#24583e",
          800: "#1e4733",
          900: "#1a3b2b",
          950: "#0c2017",
        },
        sage: {
          50: "#f6f8f6",
          100: "#eaf0ea",
          200: "#d6e2d6",
          300: "#b6ceb6",
          400: "#92b493",
          500: "#749a75",
          600: "#5a7c5b",
          700: "#486349",
          800: "#3c503d",
          900: "#334334",
          950: "#1a241b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        heading: ["var(--font-manrope)", "Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

