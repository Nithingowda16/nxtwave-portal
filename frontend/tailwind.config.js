/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // supports class-based dark mode
  theme: {
    extend: {
      colors: {
        google: {
          blue: {
            DEFAULT: '#1a73e8', // light theme accent
            dark: '#8ab4f8',    // dark theme accent
            light: '#e8f0fe',   // light blue background
          },
          red: {
            DEFAULT: '#ea4335',
            dark: '#f28b82',
            light: '#fce8e6',
          },
          yellow: {
            DEFAULT: '#fbbc05',
            dark: '#fdd663',
            light: '#fef7e0',
          },
          green: {
            DEFAULT: '#34a853',
            dark: '#81c995',
            light: '#e6f4ea',
          },
          gray: {
            50: '#f8f9fa',
            100: '#f1f3f4',
            200: '#e8eaed',
            300: '#dadce0',
            400: '#bdc1c6',
            500: '#9aa0a6',
            600: '#80868b',
            700: '#5f6368',
            800: '#3c4043',
            900: '#202124', // google body dark
          },
          surface: {
            light: '#ffffff',
            dark: '#2d2d30', // google card dark
          }
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Roboto', 'Product Sans', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
