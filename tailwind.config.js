/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          50:  '#fdf8ee',
          100: '#f9f1de',
          200: '#f4ecd8',
          300: '#ebe0c2',
          400: '#c9b78a',
          500: '#8a7e6c',
        },
        ink: {
          DEFAULT: '#2b2620',
          soft:    '#5a4f42',
          mute:    '#8a7e6c',
        },
        terra: {
          gold:  '#b8862e',
          red:   '#a14a3c',
          green: '#4a6b3a',
          teal:  '#1c4f4c',
          tealLight: '#7fc6c2',
        },
      },
      fontFamily: {
        title:  ['"Caveat"', 'cursive'],
        body:   ['"Patrick Hand"', 'cursive'],
        mono:   ['"Special Elite"', 'monospace'],
        adventure: ['"Pirata One"', 'cursive'],
      },
    },
  },
  plugins: [],
}
