/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#2563eb',
        'brand-green': '#16a34a',
        'brand-amber': '#f59e0b',
        'brand-lavender': '#a78bfa',
        'brand-bg-light': '#f8fafc',
        'brand-bg-dark': '#0f172a',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",     // ← IMPORTANT
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",     // if you have /src
  ],
  theme: { extend: {} },
  plugins: [],
};
