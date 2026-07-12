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
        paper: {
          DEFAULT: '#fffbf0',
          edge: '#efe7cf',
          rule: '#efe9da',
          text: '#3a3327',
        },
      },
      fontFamily: {
        'roboto-mono': ['Roboto Mono', 'monospace'],
      },
      fontSize: {
        'xs': '11px',
      },
      animation: { blink: 'blink 1s linear infinite' },
      keyframes: { blink: { '50%': { opacity: '0' } } }
    },

  },
  plugins: [],
}

