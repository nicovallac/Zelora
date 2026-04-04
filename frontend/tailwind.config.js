/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Futuristic violet — single accent color
        brand: {
          50:  '#faf5ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Warm neutral system
        ink: {
          50:  '#eceae4',   // page background — warm gray
          75:  '#f0eee8',   // slightly lighter
          100: '#f5f4ef',   // card / panel surface
          150: '#eae8e1',   // subtle dividers
          200: '#dddbd2',   // borders
          300: '#c4c1b4',   // muted borders / placeholders
          400: '#9a9789',   // muted text
          500: '#6e6b5e',   // secondary text
          600: '#4a4840',   // body text
          700: '#302e28',   // strong text
          800: '#1d1c18',   // headings
          900: '#111110',   // primary text
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Manrope"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Lab panel system — soft, layered, never harsh
        card:   '0 1px 2px rgba(0,0,0,0.03), 0 6px 18px rgba(0,0,0,0.04)',
        soft:   '0 2px 8px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.05)',
        float:  '0 4px 16px rgba(0,0,0,0.05), 0 20px 52px rgba(0,0,0,0.07)',
        hover:  '0 6px 24px rgba(0,0,0,0.08), 0 24px 56px rgba(0,0,0,0.09)',
        inset:  'inset 0 1px 3px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl':  '16px',
        '3xl':  '24px',
        '4xl':  '32px',
        '5xl':  '40px',
      },
      letterSpacing: {
        label: '0.08em',
        wide:  '0.12em',
        wider: '0.18em',
      },
    }
  },
  plugins: []
};
