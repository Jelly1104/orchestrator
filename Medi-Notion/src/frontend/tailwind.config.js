/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./main.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "../components/**/*.{js,ts,jsx,tsx}",
    "../features/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
