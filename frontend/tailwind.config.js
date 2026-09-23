/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#090d16',
          card: '#0f172a',
          cardBorder: '#1e293b',
          accent: '#06b6d4',      // Cyan / Neon
          accentGlow: 'rgba(6, 182, 212, 0.25)',
          safe: '#10b981',        // Emerald green
          safeGlow: 'rgba(16, 185, 129, 0.25)',
          suspicious: '#f59e0b',  // Amber
          suspiciousGlow: 'rgba(245, 158, 11, 0.25)',
          danger: '#ef4444',      // Crimson red
          dangerGlow: 'rgba(239, 68, 68, 0.25)',
          caution: '#94a3b8',     // Slate
          cautionGlow: 'rgba(148, 163, 184, 0.25)',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0%)' },
        }
      }
    },
  },
  plugins: [],
}
