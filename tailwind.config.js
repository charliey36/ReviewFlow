/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f4ea',
          100: '#ceead5',
          200: '#a8d5b5',
          300: '#7cbf94',
          400: '#4ca86e',
          500: '#1e8e3e',
          600: '#188038',
          700: '#137333',
          800: '#0f5c29',
          900: '#0b451f',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(60, 64, 67, 0.06), 0 1px 3px 1px rgba(60, 64, 67, 0.08)',
        'card-hover': '0 1px 3px 0 rgba(60, 64, 67, 0.1), 0 6px 12px 2px rgba(60, 64, 67, 0.1)',
        'card-lg': '0 2px 4px 0 rgba(60, 64, 67, 0.06), 0 8px 24px 2px rgba(60, 64, 67, 0.1)',
      },
    },
  },
  plugins: [],
};
