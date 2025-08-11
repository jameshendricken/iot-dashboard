/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/assets/css/**/*.{css}", // optional, good for safety
    "./src/assets/css/component/**/*.css" // your component folder
  ],
  theme: {
    extend: {
      colors: {
        // optional: semantic tokens that map to CSS variables
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        brand: {
          DEFAULT: 'var(--brand)',
          fg: 'var(--brand-fg)',
        },
      },
    },
  },
  plugins: [],
};
