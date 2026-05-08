import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#0a0a1a',
          secondary: '#0f0f23',
          card: '#141428',
          sidebar: '#0d0d20',
        },
        accent: {
          DEFAULT: '#6c5ce7',
          hover: '#7c6ef7',
        },
      },
    },
  },
  plugins: [],
};

export default config;
