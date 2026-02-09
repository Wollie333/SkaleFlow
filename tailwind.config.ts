import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Teal (Mana Marketing)
        teal: {
          DEFAULT: '#1E6B63',
          light: '#267D74',
          dark: '#175650',
        },
        // Secondary - Gold (Premium accent)
        gold: {
          DEFAULT: '#C8A86E',
          light: '#D4B97E',
        },
        // Dark backgrounds
        dark: {
          DEFAULT: '#0F1F1D',
          light: '#162A27',
        },
        // Light backgrounds
        cream: {
          DEFAULT: '#F0ECE4',
          warm: '#F5F1EA',
        },
        // Text colors
        charcoal: '#2C2C2C',
        stone: '#7A756D',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-teal-gold': 'linear-gradient(90deg, #1E6B63, #C8A86E)',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease forwards',
        'bounce-slow': 'bounce 1.5s infinite',
        'slide-in-right': 'slideInRight 250ms ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
