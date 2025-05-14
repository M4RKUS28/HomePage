/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#10B981', // Emerald 500
        'secondary': '#3B82F6', // Blue 500
        'accent': '#EC4899', // Pink 500
        'neutral-dark': '#1F2937', // Gray 800
        'neutral-light': '#F3F4F6', // Gray 100
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s cubic-bezier(0.250, 0.460, 0.450, 0.940) both',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Add a nice font, install if needed
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // If you want styled form elements
  ],
}