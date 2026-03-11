import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ira: {
          navy: "#262262",
          red: "#ec1e24",
          gray: "#f2f4f7"
        }
      },
      fontFamily: {
        sans: [
          "Frutiger",
          "Frutiger Linotype",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
