import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d8ecff',
          200: '#b9ddff',
          300: '#8ec8ff',
          400: '#5eacff',
          500: '#338cff',
          600: '#1f6fea',
          700: '#1a57c0',
          800: '#1a4796',
          900: '#1b3d77'
        },
        accent: '#ff7ab6'
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,0.06)'
      }
    },
  },
  plugins: [],
}

export default config

