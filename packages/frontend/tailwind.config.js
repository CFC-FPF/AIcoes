
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      colors: {
        'bg-dark': '#0a1628',
        'bg-input': '#1a2942',
        'brand': {
          'light': '#7C3AED',
          'dark': '#4F46E5',
        },
      },
      
      borderRadius: {
        'component': '0.75rem',
      },
      
      spacing: {
        'input-x': '2rem',
        'input-y': '1rem',
      },
    },
  },
  plugins: [],
}