/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        deckly: {
          primary: "#2AD485", // Brand Green
          secondary: "#a78bfa", // Soft Purple (30%)
          accent: "#f43f5e", // Rose 500
          background: "#12121a", // Deep Midnight (Matches App.css)
          card: "rgba(30, 41, 59, 0.7)", // Slate 800 with opacity
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))",
      },
    },
  },
  plugins: [],
};
