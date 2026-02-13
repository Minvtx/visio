/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class', 'class'],
	content: [
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				// Meridian Palette
				meridian: {
					cream: '#F8F6F3',
					deep: '#0A1628',
					gold: '#F5A623',
					ice: '#EFF4F9',
					precision: '#2E5CFF',
					mist: 'rgba(255, 255, 255, 0.6)',
				},
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
				},
				'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
				},
				'primary-foreground': 'hsl(var(--primary-foreground) / <alpha-value>)',
				secondary: {
					DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
					foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
				},
				'secondary-foreground': 'hsl(var(--secondary-foreground) / <alpha-value>)',
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
				},
				'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
				},
				'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
				destructive: {
					DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
					foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
				},
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				popover: {
					DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
					foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
				},
				chart: {
					'1': 'hsl(var(--chart-1) / <alpha-value>)',
					'2': 'hsl(var(--chart-2) / <alpha-value>)',
					'3': 'hsl(var(--chart-3) / <alpha-value>)',
					'4': 'hsl(var(--chart-4) / <alpha-value>)',
					'5': 'hsl(var(--chart-5) / <alpha-value>)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				display: ['Space Grotesk', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace'],
			},
			backgroundImage: {
				'meridian-dawn': 'linear-gradient(135deg, #0A1628 0%, #2E5CFF 50%, #F5A623 100%)',
				'soft-glow': 'radial-gradient(circle at center, rgba(245, 166, 35, 0.15) 0%, rgba(248, 246, 243, 0) 70%)',
				'ice-shimmer': 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(239, 244, 249, 0.5) 100%)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}
