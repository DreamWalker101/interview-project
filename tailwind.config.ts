import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "canvas-white": "#ffffff",
        "graphite-inset": "#2d3637",
        "shadow-green-bg": "#0d5b3b",
        "deep-forest-bg": "#083a26",
        "stone-beige": "#e9e7e2",
        "outline-gray": "#cccccc",
        "text-black": "#000000",
        "muted-ash": "#999999",
        "mint-accent": "#a3fda7",
        "subtle-sage": "#9cb0a8",
        "subtle-gray-card": "#838676",
        background: "#f9f9f9",
        secondary: "#576061",
        primary: "#0d6d29",
        "primary-container": "#a3fda7",
        "on-surface": "#1b1b1b",
        "surface-container": "#eeeeee",
        "outline-variant": "#bfcabb",
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
        heading: ["Inter", "sans-serif"],
        "heading-lg": ["Inter", "sans-serif"],
        subheading: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      fontSize: {
        heading: ["24px", { lineHeight: "1.4", fontWeight: "700" }],
        label: ["12px", { lineHeight: "1.0", fontWeight: "500" }],
        subheading: ["18px", { lineHeight: "1.5", fontWeight: "500" }],
        body: [
          "15px",
          { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "400" },
        ],
        "heading-lg": ["30px", { lineHeight: "1.2", fontWeight: "700" }],
      },
      spacing: {
        xl: "30px",
        lg: "20px",
        md: "12px",
        sm: "8px",
        xs: "4px",
        section: "30px",
        "card-padding": "20px",
        "2xl": "40px",
        "3xl": "80px",
        "gap-element": "8px",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        card: "0 4px 24px 0 rgba(0,0,0,0.08)",
        "card-lg": "0 8px 40px 0 rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
