/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: {
          light: '#7091E6', // Light primary color
          DEFAULT: '#3D52A0', // Main primary color
          dark: '#8697C4', // Dark primary color
        },
        secondary: {
          light: '#ADB8DA', // Light secondary color
          DEFAULT: '#EDE8F5', // Main secondary color
        },
      },
    },
  },
  plugins: [],
};
