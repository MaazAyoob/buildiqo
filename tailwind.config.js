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
        navy: {
          900: '#0B132B',
          950: '#070C1E',
          800: '#101828',
          700: '#1C2536',
          600: '#2D3748',
        },
        surface: {
          ground: '#F4F7FC',
          card: '#FFFFFF',
          muted: '#F8FAFD',
          subtle: '#EEF2F9',
          border: '#E3E8F2',
          borderStrong: '#CBD5E1',
        },
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
        royal: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#4F46E5',
          600: '#3B5BDB',
          700: '#3730A3',
        },
        cyan: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        violet: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
        },
        accent: {
          amber: '#F59E0B', // Logo Intelligence Dot
          orange: '#F97316',
          yellow: '#FBBF24',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
        blueprint: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        construction: {
          steel: '#475569',
          rebar: '#334155',
          concrete: '#94A3B8',
          curing: '#0284C7',
          amber: '#F59E0B',
          brick: '#DC2626',
          sand: '#D97706',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card-sm': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 12px 28px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        'card-elevated': '0 20px 35px -8px rgba(15, 23, 42, 0.1), 0 8px 16px -4px rgba(15, 23, 42, 0.04)',
        'brand': '0 4px 14px 0 rgba(37, 99, 235, 0.25)',
        'brand-hover': '0 8px 22px 0 rgba(37, 99, 235, 0.38)',
        'amber': '0 4px 14px 0 rgba(245, 158, 11, 0.25)',
        'emerald': '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
        'violet': '0 4px 14px 0 rgba(139, 92, 246, 0.25)',
        'glow-blue': '0 0 24px 0 rgba(37, 99, 235, 0.22)',
        'glow-amber': '0 0 20px 0 rgba(245, 158, 11, 0.25)',
        'glow-emerald': '0 0 20px 0 rgba(16, 185, 129, 0.25)',
        'glow-violet': '0 0 20px 0 rgba(139, 92, 246, 0.25)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideUp: 'slideUp 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}