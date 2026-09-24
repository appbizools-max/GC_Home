/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        admin: {
          light: "#BBE9D2",
          DEFAULT: "#2D8A68",
          dark: "#1E4E3D"
        },
        brand: {
          deepGreen: '#123D2A',
          softGreen: '#6FAF72',
          lightGreen: '#EAF5EC',
          gold: '#C9A227',
          lightGold: '#E8D49A',
          charcoal: '#171A18',
          white: '#FFFFFF',
          background: '#F8FAF8'
        }
      }
    },
  },
  plugins: [],
}
