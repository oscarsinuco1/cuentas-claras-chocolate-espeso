/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Stitch Light Mode palette - customColor: #13ec6d
        light: {
          bg: '#F5F7FA',
          card: '#FFFFFF',
          hover: '#F0F2F5',
          border: '#E4E6EB',
          elevated: '#FFFFFF',
        },
        // Primary green from Stitch
        primary: {
          50: '#E8FDF2',
          100: '#C5FAE0',
          200: '#8FF5C2',
          300: '#4DECA0',
          400: '#13ec6d',
          500: '#10D760',
          600: '#0DBF54',
          700: '#0A9944',
          800: '#087334',
          900: '#054D24',
        },
        // Text colors (dark for light mode)
        text: {
          primary: '#1F2937',
          secondary: '#4B5563',
          muted: '#9CA3AF',
        },
        // Success (same as primary for consistency)
        success: {
          50: '#E8FDF2',
          100: '#C5FAE0',
          200: '#8FF5C2',
          300: '#4DECA0',
          400: '#13ec6d',
          500: '#10D760',
          600: '#0DBF54',
          700: '#0A9944',
          800: '#087334',
          900: '#054D24',
        },
        // Warning yellow
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Danger red
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'stitch': '8px',
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
