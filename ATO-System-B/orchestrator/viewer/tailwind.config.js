/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e94560',
        secondary: '#0f3460',
        dark: {
          bg: '#1a1a2e',
          card: '#16213e',
          border: '#333'
        }
      }
    }
  },
  plugins: []
};
