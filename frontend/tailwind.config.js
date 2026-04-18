/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
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
        // Light theme — high numbers = dark text, low numbers = light surfaces
        ink: {
          50:  '#f9f9f7',
          75:  '#f4f4f1',
          100: '#efefeb',
          150: '#e5e5df',
          200: '#d4d4cc',
          300: '#b8b8ae',
          400: '#919188',
          500: '#6e6b60',
          600: '#4a4840',
          700: '#302e28',
          800: '#1d1c18',
          900: '#111110',
        },
        sidebar: {
          bg:         '#111110',
          surface:    '#1a1a18',
          border:     'rgba(255,255,255,0.07)',
          text:       'rgba(255,255,255,0.55)',
          'text-dim': 'rgba(255,255,255,0.32)',
          'text-on':  '#ffffff',
          hover:      'rgba(255,255,255,0.07)',
          active:     'rgba(139,92,246,0.18)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Space Grotesk"', '"Manrope"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)',
        soft:  '0 2px 8px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.07)',
        float: '0 4px 16px rgba(0,0,0,0.06), 0 20px 52px rgba(0,0,0,0.09)',
        hover: '0 6px 24px rgba(0,0,0,0.10), 0 24px 56px rgba(0,0,0,0.11)',
        ring:  '0 0 0 3px rgba(139,92,246,0.25)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      },
      letterSpacing: {
        label: '0.06em',
        wide:  '0.10em',
        wider: '0.16em',
      },
    }
  },
  plugins: []
};
