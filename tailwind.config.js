/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0B0F19',
        graphite: '#111827',
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD', // Logo Left Bar (Soft Sky)
          400: '#60A5FA',
          500: '#3B82F6', // Logo Center Bar (Vibrant Blue)
          600: '#2563EB', // Primary Brand Blue & "i"
          700: '#1D4ED8', // Logo Right Bar (Deep Cobalt)
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#0F172A', // Logo Hexagon Border & "build / qo" Slate
        },
        accent: {
          amber: '#F59E0B', // Logo Intelligence Dot
          orange: '#F97316',
          yellow: '#FBBF24',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 12px 28px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        'brand': '0 4px 14px 0 rgba(37, 99, 235, 0.25)',
        'brand-hover': '0 8px 20px 0 rgba(37, 99, 235, 0.35)',
        'amber': '0 4px 14px 0 rgba(245, 158, 11, 0.25)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
      }
    },
  },
  plugins: [],
}