/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'apple-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'apple-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'apple-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        'apple-light': {
          'primary': '#0071e3',
          'primary-focus': '#0068d1',
          'primary-content': '#ffffff',
          
          'secondary': '#1d1d1f',
          'secondary-focus': '#2a2a2b',
          'secondary-content': '#ffffff',
          
          'accent': '#5ac8fa',
          'accent-focus': '#47b0e0',
          'accent-content': '#ffffff',
          
          'neutral': '#f5f5f7',
          'neutral-focus': '#e6e6e8',
          'neutral-content': '#1d1d1f',
          
          'base-100': '#ffffff',
          'base-200': '#f5f5f7',
          'base-300': '#e6e6e8',
          'base-content': '#1d1d1f',
          
          'info': '#5ac8fa',
          'success': '#34c759',
          'warning': '#ff9f0a',
          'error': '#ff3b30',
          
          '--rounded-box': '1rem',
          '--rounded-btn': '9999px',
          '--rounded-badge': '9999px',
          
          '--animation-btn': '0.3s',
          '--animation-input': '0.2s',
          
          '--btn-focus-scale': '0.98',
          '--border-btn': '1px',
          '--tab-border': '2px',
          '--tab-radius': '0.5rem',
        },
        'apple-dark': {
          'primary': '#0a84ff',
          'primary-focus': '#0077ed',
          'primary-content': '#ffffff',
          
          'secondary': '#8e8e93',
          'secondary-focus': '#79797e',
          'secondary-content': '#ffffff',
          
          'accent': '#64d2ff',
          'accent-focus': '#5bc0e8',
          'accent-content': '#ffffff',
          
          'neutral': '#2c2c2e',
          'neutral-focus': '#3a3a3c',
          'neutral-content': '#f5f5f7',
          
          'base-100': '#000000',
          'base-200': '#1c1c1e',
          'base-300': '#2c2c2e',
          'base-content': '#f5f5f7',
          
          'info': '#64d2ff',
          'success': '#30d158',
          'warning': '#ff9f0a',
          'error': '#ff453a',
          
          '--rounded-box': '1rem',
          '--rounded-btn': '9999px',
          '--rounded-badge': '9999px',
          
          '--animation-btn': '0.3s',
          '--animation-input': '0.2s',
          
          '--btn-focus-scale': '0.98',
          '--border-btn': '1px',
          '--tab-border': '2px',
          '--tab-radius': '0.5rem',
        },
      },
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      "dim",
      "nord",
      "sunset",
    ],
  },
};