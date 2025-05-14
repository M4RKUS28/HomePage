/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Your theme extensions here
    },
  },
  plugins: [],
  darkMode: 'class' // Use 'class' for theme switching
}