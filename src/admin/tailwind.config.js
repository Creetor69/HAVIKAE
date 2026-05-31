
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Open Sans', 'sans-serif'],
        'serif': ['Playfair Display', 'serif'],
      },
      colors: {
        'hav-forest': '#0F4A3C',
        'hav-gold': '#C9A236',
        'hav-cream': '#FCF2D5',
        'hav-wheat': '#F2C94C',
        'hav-sage': '#7FAF8D',
        'hav-olive': '#3F5A3C',
        'hav-brown': '#3F5A3C',
        'hav-orange': {
          '50': '#FCF2D5', 
          '100': '#FCF2D5',
          '200': '#F2C94C', 
          '300': '#F2C94C',
          '400': '#C9A236', 
          '500': '#C9A236',
          '600': '#0F4A3C', 
          '700': '#0F4A3C',
          '800': '#3F5A3C', 
          '900': '#0F4A3C', 
          '950': '#0F4A3C', 
        }
      }
    },
  },
  plugins: [],
}
