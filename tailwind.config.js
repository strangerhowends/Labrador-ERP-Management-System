/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: {
          950: "#121511",
          900: "#1f261e",
          700: "#4a5747",
          500: "#6f7b6d",
          300: "#aab2a8",
          100: "#edf1eb",
        },
        sage: {
          500: "#6d8466",
          600: "#5d7256",
          700: "#4f6249",
        },
        sand: {
          50: "#f8f5ef",
          100: "#f2ede3",
          200: "#e4dac8",
        },
      },
      boxShadow: {
        soft: "0 16px 40px -20px rgba(18, 21, 17, 0.28)",
      },
    },
  },
  plugins: [],
}

