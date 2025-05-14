// frontend/frontend/tailwind.config.js (updated)
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        // Primary, Secondary, and Accent colors (from CSS variables)
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-light': 'rgb(var(--color-primary-light) / <alpha-value>)',
        'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
        
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        'secondary-light': 'rgb(var(--color-secondary-light) / <alpha-value>)',
        'secondary-dark': 'rgb(var(--color-secondary-dark) / <alpha-value>)',
        
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-light': 'rgb(var(--color-accent-light) / <alpha-value>)',
        'accent-dark': 'rgb(var(--color-accent-dark) / <alpha-value>)',
        
        // Neutral colors for both light and dark theme
        'neutral-50': 'rgb(var(--color-neutral-50) / <alpha-value>)',
        'neutral-100': 'rgb(var(--color-neutral-100) / <alpha-value>)',
        'neutral-200': 'rgb(var(--color-neutral-200) / <alpha-value>)',
        'neutral-300': 'rgb(var(--color-neutral-300) / <alpha-value>)',
        'neutral-400': 'rgb(var(--color-neutral-400) / <alpha-value>)',
        'neutral-500': 'rgb(var(--color-neutral-500) / <alpha-value>)',
        'neutral-600': 'rgb(var(--color-neutral-600) / <alpha-value>)',
        'neutral-700': 'rgb(var(--color-neutral-700) / <alpha-value>)',
        'neutral-800': 'rgb(var(--color-neutral-800) / <alpha-value>)',
        'neutral-900': 'rgb(var(--color-neutral-900) / <alpha-value>)',
        'neutral-950': 'rgb(var(--color-neutral-950) / <alpha-value>)',
        
        // Always keep the highest contrast
        'neutral-light': 'rgb(var(--color-neutral-100) / <alpha-value>)',
        'neutral-dark': 'rgb(var(--color-neutral-900) / <alpha-value>)',
      },
      animation: {
        'float': 'float 5s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse-fast 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'soft-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      transitionDuration: {
        '2000': '2000ms',
      }
    },
  },
  plugins: [],
}