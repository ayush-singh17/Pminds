/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#111827',
        border: '#1E293B',
        accent: '#06b6d4',
        emerald: '#10B981',
        muted: '#94A3B8',
        primary: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Lekton', 'monospace'],
      },
    },
  },
  plugins: [],
}
