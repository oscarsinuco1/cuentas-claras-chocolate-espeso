/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Facebook Dark Mode palette
        dark: {
          bg: '#18191A',
          card: '#242526',
          hover: '#3A3B3C',
          border: '#3E4042',
          elevated: '#2D2E2F',
        },
        // Facebook blue accent
        primary: {
          50: '#E7F3FF',
          100: '#C3DFFD',
          200: '#90C8FC',
          300: '#5AAFFA',
          400: '#2D96F6',
          500: '#2374E1',
          600: '#1A5DC4',
          700: '#1449A3',
          800: '#0E3680',
          900: '#0A2660',
        },
        // Text colors
        text: {
          primary: '#E4E6EB',
          secondary: '#B0B3B8',
          muted: '#8A8D91',
        },
        // Success green
        success: {
          50: '#E6F6EB',
          100: '#C3EBD1',
          200: '#8DD9A8',
          300: '#57C77F',
          400: '#31A24C',
          500: '#31A24C',
          600: '#2B8A42',
          700: '#237036',
          800: '#1B572A',
          900: '#143E1F',
        },
        // Warning yellow
        warning: {
          50: '#FFF8E6',
          100: '#FFEDB8',
          200: '#FFE08A',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#F5B800',
          600: '#D99E00',
          700: '#B38200',
          800: '#8C6600',
          900: '#664A00',
        },
        // Danger red
        danger: {
          50: '#FFEBE9',
          100: '#FECECA',
          200: '#FDA3A3',
          300: '#FA6E6E',
          400: '#F54242',
          500: '#F02849',
          600: '#D91A3D',
          700: '#B31432',
          800: '#8C0F27',
          900: '#660A1C',
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
