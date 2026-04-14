/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm & Familiar - Café con Amigos palette
        primary: {
          50: '#f0f7f7',
          100: '#daf0ee',
          200: '#b8e0dc',
          300: '#8ac9c4',
          400: '#5aada6',
          500: '#3f918a',
          600: '#357872',
          700: '#2f615d',
          800: '#2a504d',
          900: '#274341',
        },
        // Terracotta warm accent
        accent: {
          50: '#fef6f3',
          100: '#fde8e0',
          200: '#fbd5c6',
          300: '#f7b89f',
          400: '#f19470',
          500: '#e87248',
          600: '#d4572e',
          700: '#b14525',
          800: '#923b23',
          900: '#793521',
        },
        // Warm cream backgrounds
        cream: {
          50: '#FFFDF9',
          100: '#FBF8F4',
          200: '#F5EDE4',
          300: '#EBE0D3',
          400: '#DDD0C0',
          500: '#CBBFAD',
          600: '#B3A48E',
          700: '#958571',
          800: '#7A6C5B',
          900: '#5C5245',
        },
        // Sage green for success
        sage: {
          50: '#f4f8f5',
          100: '#e6f0e8',
          200: '#cfe1d3',
          300: '#a8c9b0',
          400: '#7aab86',
          500: '#5a9168',
          600: '#467553',
          700: '#3a5e44',
          800: '#314c39',
          900: '#2a4031',
        },
        // Warm amber for warnings
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Soft coral for errors
        coral: {
          50: '#fef5f5',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
