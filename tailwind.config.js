/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dusk: '#1B2A4A',
        canopy: '#0E4D3C',
        sand: '#F3E8D2',
        clay: '#C75B39',
        bloom: '#E8A33D',
        ink: '#16201C'
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      borderRadius: {
        organic: '40% 60% 55% 45% / 50% 45% 55% 50%',
      }
    },
  },
  plugins: [],
}
