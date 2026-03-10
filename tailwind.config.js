/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9ebff",
          200: "#bddbff",
          300: "#91c2ff",
          400: "#5fa2ff",
          500: "#337ff5",
          600: "#2261d8",
          700: "#1f4db0",
          800: "#1f428f",
          900: "#203b72"
        },
        ink: {
          900: "#0f172a",
          700: "#334155",
          500: "#64748b",
          300: "#cbd5e1",
          100: "#f1f5f9"
        }
      },
      boxShadow: {
        soft: "0 10px 40px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
