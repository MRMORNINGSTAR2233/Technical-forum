/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'so-orange': '#f48024',
        'so-blue': '#0074cc',
        'so-blue-light': '#0a95ff',
        'so-black': '#242729',
        'so-powder': '#e4e6e8',
        'so-gray': '#6a737c',
        'so-gray-light': '#9fa6ad',
        'so-bg': '#f8f9f9',
        'so-border': '#d6d9dc',
        'so-tag-bg': '#e1ecf4',
        'so-tag-text': '#39739d',
      },
    },
  },
  plugins: [],
}

