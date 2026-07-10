/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5', // Tint
          100: '#ccfbf1', // Soft
          200: '#99f6e4',
          300: '#5dd5c4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488', // Accent
          700: '#0f766e', // Strong
          800: '#115e59', // Ink
          900: '#134e4a',
          950: '#042f2e',
        },
      },
      fontSize: {
        'xs': '11px',
      },
    },

  },
  plugins: [],
}

