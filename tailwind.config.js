/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // keep if you have /src
  ],
  theme: {
    extend: {
      colors: {
        // your existing brand colours
        'brand-blue': '#2563eb',
        'brand-green': '#16a34a',
        'brand-amber': '#f59e0b',
        'brand-lavender': '#a78bfa',
        'brand-bg-light': '#f8fafc',
        'brand-bg-dark': '#0f172a',

        // Tortoise & Hare tokens (optional but useful)
        th: {
          ink: "#11122D",
          slate: "#5F6B7A",
          sand: "#FFF8F1",
          cloud: "#F5F3EE",
          emerald: "#23B384",
        },
      },
      borderRadius: { "2xl": "1.25rem" },
      boxShadow: {
        card: "0 10px 24px rgba(0,0,0,0.08)",
        btn: "0 6px 16px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};
