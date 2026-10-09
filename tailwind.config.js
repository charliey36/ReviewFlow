/** @type {import('tailwindcss').Config} */

/* Colors backed by CSS variables (see globals.css) so light/dark flip in one
   place instead of needing a `dark:` variant on every element. Channels are
   stored as "R G B" so Tailwind opacity modifiers (e.g. `border-line/60`)
   keep working. */
const token = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Inter is self-hosted via next/font/local in app/layout.tsx. The
        // fallbacks are the platform UI fonts, so text never falls back to a
        // serif/odd default if the font file is slow to load.
        sans: [
          'var(--font-inter)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      colors: {
        /* Pentriq green, tuned vivid: the same hue family as the original
           brand, with enough saturation to read as an accent that pops. */
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        /* Semantic neutrals. `app` is the page canvas, `surface` is anything
           that sits on it (cards, inputs, popovers), `ink` is text, `line` is
           hairline borders. */
        app: token('--bg'),
        surface: {
          DEFAULT: token('--surface'),
          subtle: token('--surface-2'),
          muted: token('--surface-3'),
          sidebar: token('--sidebar'),
          // Legacy aliases kept so any untouched markup keeps working.
          bg: token('--bg'),
          card: token('--surface'),
        },
        ink: {
          DEFAULT: token('--ink'),
          2: token('--ink-2'),
          3: token('--ink-3'),
          4: token('--ink-4'),
        },
        line: {
          DEFAULT: token('--line'),
          strong: token('--line-strong'),
        },
      },
      /* Elevation scale. Values live in CSS variables because dark mode
         expresses depth with surface lift + a faint top highlight instead of
         drop shadows (Linear-style "luminance stacking"). */
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md: 'var(--shadow-card)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'card-lg': 'var(--shadow-pop)',
        pop: 'var(--shadow-pop)',
        float: 'var(--shadow-float)',
        'btn-primary': 'var(--shadow-btn-primary)',
        hero: 'var(--shadow-hero)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in': 'rf-fade-in 200ms ease-out both',
        'fade-in-up': 'rf-fade-in-up 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop-in': 'rf-pop-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'grow-x': 'rf-grow-x 900ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'palette-in': 'rf-palette-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'toast-in': 'rf-toast-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'float-slow': 'rf-float 16s ease-in-out infinite',
        'float-slower': 'rf-float 22s ease-in-out infinite reverse',
      },
    },
  },
  plugins: [],
};
