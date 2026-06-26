/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7B1A1A',
          50: '#FDF2F2',
          100: '#FDE8E8',
          200: '#FBD5D5',
          300: '#F8B4B4',
          400: '#F27A7A',
          500: '#E54848',
          600: '#D13232',
          700: '#7B1A1A',
          800: '#5A1313',
          900: '#3D0D0D',
        },
        popover: 'rgb(255 255 255 / 0.98)',
        'popover-foreground': '#000000',
      },
      animation: {
        'fade-in-0': 'fadeIn 0.2s ease-out',
        'zoom-in-95': 'zoomIn 0.2s ease-out',
        'slide-in-from-top-2': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-0.5rem)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}