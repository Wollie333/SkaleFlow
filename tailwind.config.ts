import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Teal (Mana Marketing) — fixed accent
        teal: {
          DEFAULT: '#1E6B63',
          light: '#267D74',
          dark: '#175650',
        },
        // Secondary - Gold (Premium accent) — fixed accent
        gold: {
          DEFAULT: '#C8A86E',
          light: '#D4B97E',
        },
        // Dark backgrounds — fixed
        dark: {
          DEFAULT: '#0F1F1D',
          light: '#162A27',
        },
        // Swappable colors (light ↔ dark via CSS variables)
        cream: {
          DEFAULT: 'rgb(var(--color-cream) / <alpha-value>)',
          warm: 'rgb(var(--color-cream-warm) / <alpha-value>)',
        },
        charcoal: 'rgb(var(--color-charcoal) / <alpha-value>)',
        stone: 'rgb(var(--color-stone) / <alpha-value>)',
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
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
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
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
