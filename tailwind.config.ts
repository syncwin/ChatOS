
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: "1rem", // 16px minimum gutter for mobile
				xs: "1rem", // 16px for extra small screens
				sm: "1.25rem", // 20px for small tablets
				md: "1.5rem", // 24px for tablets
				lg: "1.5rem", // 24px for desktop
				xl: "1.5rem", // 24px for large desktop
				"2xl": "2rem", // 32px for extra large screens
			},
			screens: {
			xs: "375px",
			sm: "640px",
			md: "768px",
			lg: "1024px",
			xl: "1280px",
			"2xl": "1536px",
			// Device-specific breakpoints
			mobile: { max: "639px" },
			tablet: { min: "640px", max: "1023px" },
			"tablet-only": { min: "768px", max: "1023px" },
			desktop: { min: "1024px" },
		},
		},
		extend: {
			screens: {
				xs: "475px",
				sm: "640px",
				md: "768px",
				lg: "1024px",
				xl: "1280px",
				"2xl": "1400px",
				// Device-specific breakpoints
				mobile: { max: "639px" },
				tablet: { min: "640px", max: "1023px" },
				"tablet-only": { min: "768px", max: "1023px" },
				desktop: { min: "1024px" },
				// Gutter-specific breakpoints
				"gutter-sm": "640px", // Switch to 20px gutters
				"gutter-md": "768px", // Switch to 24px gutters
			},
			spacing: {
				// Custom gutter spacing values
				"gutter-xs": "1rem", // 16px
				"gutter-sm": "1.25rem", // 20px
				"gutter-md": "1.5rem", // 24px
				"gutter-lg": "2rem", // 32px
			},
			colors: {
				// Brand Color Palette - Enforced Colors Only
				brand: {
					base: {
						dark: '#0d0d0d',
						light: '#ffffff',
					},
					primary: '#3f00ff',
					secondary: '#FFFF00',
					accent: '#FF8000',
				},
				// Shadcn Design System Colors (using CSS variables)
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
