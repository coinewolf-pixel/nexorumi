/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { nexorum: { dark: '#0a0a0f', card: '#13131f', accent: '#6366f1' } },
      animation: { 'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite', 'glow': 'glow 2s ease-in-out infinite alternate' },
      keyframes: { glow: { '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.2)' }, '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)' } } }
    },
  },
  plugins: [],
}
