/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0B0E14',
        darkCard: '#131822',
        darkBorder: '#20293A',
        darkInput: '#0B0E14',
        brandOrange: '#FF6B00',
        brandOrangeHover: '#E05D00',
      }
    },
  },
  plugins: [],
}