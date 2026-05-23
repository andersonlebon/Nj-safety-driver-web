import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        // Gabon Forest Green — primary brand
        brand: {
          50: "#f0faf5",
          100: "#d6f2e4",
          200: "#a8e4c7",
          300: "#70cfa2",
          400: "#3db57d",
          500: "#009e60",
          600: "#007a48",
          700: "#006b3f",
          800: "#005433",
          900: "#003d26",
          950: "#002819",
        },
        // Gabon Metallic Gold — accent
        gold: {
          50: "#fffbf0",
          100: "#fff3cc",
          200: "#ffe088",
          300: "#ffc94a",
          400: "#ffb820",
          500: "#fcd116",
          600: "#d4af37",
          700: "#b8922e",
          800: "#8f7024",
          900: "#644f1a",
          950: "#3c2e0e",
        },
        // Gabon Deep Navy — secondary
        navy: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#4b6cb7",
          600: "#3b539d",
          700: "#2d3e82",
          800: "#1e2d68",
          900: "#121d4e",
          950: "#0b1138",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 4px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover":
          "0 8px 24px 0 rgb(0 0 0 / 0.09), 0 2px 6px -2px rgb(0 0 0 / 0.06)",
        luxury:
          "0 0 0 1px rgb(0 107 63 / 0.08), 0 4px 20px 0 rgb(0 0 0 / 0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
