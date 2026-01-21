/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        military: {
          900: '#1a1d1a', // Dark background
          800: '#242924', // Panel background
          700: '#2f362f', // Border/Hover
          500: '#4a574a', // Text muted
          100: '#e1e6e1', // Text light
        },
        tactical: {
          green: '#4caf50', // Success / Status OK
          orange: '#ff9800', // Warning / Action
          red: '#f44336',   // Error / Stop
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'], // For console and data
      }
    },
  },
  plugins: [],
}
