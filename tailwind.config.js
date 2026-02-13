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
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
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
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				'card-foreground': 'hsl(var(--card-foreground))',
				primary: {
					DEFAULT: '#F5A623', // Zenith Gold as primary
					foreground: '#0A1628'
				},
				'primary-foreground': 'hsl(var(--primary-foreground))',
				secondary: {
					DEFAULT: '#EFF4F9', // Meridian Ice
					foreground: '#0A1628'
				},
				'secondary-foreground': 'hsl(var(--secondary-foreground))',
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				'muted-foreground': 'hsl(var(--muted-foreground))',
				accent: {
					DEFAULT: '#2E5CFF', // Precision Blue
					foreground: '#FFFFFF'
				},
				'accent-foreground': 'hsl(var(--accent-foreground))',
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				ring: 'hsl(var(--ring))',
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				input: 'hsl(var(--input))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
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
