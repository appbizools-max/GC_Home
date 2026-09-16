/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#BBE9D2",
          DEFAULT: "#2D8A68",
          dark: "#1E4E3D",
          bg: "#EBF8F2"
        }
      }
    },
  },
  plugins: [],
}
