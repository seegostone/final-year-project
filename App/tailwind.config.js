
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'makerere-green': '#006837',
        'makerere-red': '#CE1126',
        'makerere-beige': '#D4C4A8',
        'makerere-beige-light': '#FAF8F2',
      },
      animation: {
        'slide-in-from-bottom-2': 'slideInFromBottom 0.3s ease-out',
      },
      keyframes: {
        slideInFromBottom: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};