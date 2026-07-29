/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-prompt)", "sans-serif"],
      },
      colors: {
        navy: {
          DEFAULT: "#12294B",
          dark: "#0C1B33",
          light: "#1C3B68",
        },
        audit: {
          blue: "#2C5AA0",
          sky: "#5B8DEF",
          tint: "#E8F0FB",
          slate: "#5B6472",
          hairline: "#E3E7ED",
          bg: "#F6F7F9",
        },
        status: {
          ok: "#1E8E5A",
          okBg: "#E8F5EE",
          warn: "#C77C00",
          warnBg: "#FCF1DE",
          bad: "#C23B3B",
          badBg: "#FBEAEA",
        },
      },
    },
  },
  plugins: [],
};
