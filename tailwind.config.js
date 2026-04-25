/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          50:  '#fdf8ee',
          100: '#f9edcc',
          200: '#f5e6c8',
          300: '#edd5a3',
          400: '#e2bc72',
          500: '#d4a043',
        },
        adventure: {
          brown:  '#5C3D1E',
          dark:   '#3B2510',
          gold:   '#8B6914',
          green:  '#3A5A2A',
          red:    '#8B2500',
        }
      },
      fontFamily: {
        adventure: ['"Pirata One"', 'cursive'],
        body: ['"Nunito"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
