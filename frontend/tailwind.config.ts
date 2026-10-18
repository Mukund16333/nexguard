import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        brand: {
          900: '#102A43', // Navy - headings, dark nav
          800: '#134e6f',
          700: '#176B87', // Blue - primary actions, links
          600: '#1c88ab',
          100: '#dbeafe',
          50: '#f0f7fa',
        },
        accent: {
          500: '#20B8A6', // Teal
          600: '#199e8e',
          100: '#ccfbf1',
          50: '#f0fdfa',
        },
        canvas: '#F6F8FB',
        surface: '#FFFFFF',
        'nx-text': '#172B4D',
        muted: '#526579',
        'nx-border': '#D9E2EC',
        status: {
          pass: '#18794E',
          'pass-bg': '#E6F4EA',
          warning: '#9A6700',
          'warning-bg': '#FEF3D6',
          fail: '#B42318',
          'fail-bg': '#FEE4E2',
          info: '#175CD3',
          'info-bg': '#EFF8FF',
          skipped: '#526579',
          'skipped-bg': '#F1F5F9',
        },
        border: 'hsl(var(--border, 214 32% 86%))',
        input: 'hsl(var(--input, 214 32% 91%))',
        ring: 'hsl(var(--ring, 194 71% 31%))',
        background: 'hsl(var(--background, 216 33% 97%))',
        foreground: 'hsl(var(--foreground, 218 54% 20%))',
        primary: {
          DEFAULT: '#176B87',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F0F4F8',
          foreground: '#102A43',
        },
        destructive: {
          DEFAULT: '#B42318',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#172B4D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
