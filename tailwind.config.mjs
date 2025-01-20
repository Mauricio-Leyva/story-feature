/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
	  extend: {
		animation: {
		  'fade-in': 'fade-in 0.3s ease-out',
		  'slide-up': 'slide-up 0.4s ease-out',
		},
		keyframes: {
		  'fade-in': {
			'0%': { opacity: '0' },
			'100%': { opacity: '1' },
		  },
		  'slide-up': {
			'0%': { transform: 'translateY(20px)', opacity: '0' },
			'100%': { transform: 'translateY(0)', opacity: '1' },
		  },
		},
	  },
	},
	plugins: [],
  }