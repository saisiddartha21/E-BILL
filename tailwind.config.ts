import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(56, 189, 248, 0.4), 0 0 10px -2px rgba(56, 189, 248, 0.3)',
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.4), 0 0 10px -2px rgba(245, 158, 11, 0.3)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4), 0 0 10px -2px rgba(6, 182, 212, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4), 0 0 10px -2px rgba(16, 185, 129, 0.3)',
        'glow-purple': '0 0 25px -5px rgba(168, 85, 247, 0.4), 0 0 10px -2px rgba(168, 85, 247, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
        'glass-card': '0 20px 40px -15px rgba(0, 0, 0, 0.3), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
        'glass-hover': '0 25px 50px -12px rgba(56, 189, 248, 0.25), inset 0 1px 2px 0 rgba(255, 255, 255, 0.25)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(1deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "shimmer": "shimmer 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
