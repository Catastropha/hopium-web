import type { Config } from 'tailwindcss';

/**
 * Desktop-first palette. Unlike hopium-tma we do NOT couple to Telegram
 * theme vars — this is a public web app rendered outside Telegram.
 * The design is dark-mode default with a light fallback via the `light`
 * media query toggled on <html> by the user's OS preference.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0b0d12',
          elevated: '#141821',
          subtle: '#1c222e',
        },
        fg: {
          DEFAULT: '#f5f7fa',
          muted: '#a0a8b7',
          subtle: '#6b7280',
        },
        border: {
          DEFAULT: '#232a37',
          subtle: '#1c222e',
        },
        accent: {
          DEFAULT: '#4f8cff',
          hover: '#6ba0ff',
          subtle: '#1a2544',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'system-ui',
          'sans-serif',
        ],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      maxWidth: {
        content: '72rem',
        prose: '42rem',
      },
      fontSize: {
        hero: ['3.75rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
      },
    },
  },
  plugins: [],
};

export default config;
