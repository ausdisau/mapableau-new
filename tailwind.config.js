/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        mapable: {
          brand: "hsl(var(--mapable-brand))",
          "brand-dark": "hsl(var(--mapable-brand-dark))",
          navy: "var(--mapable-navy-950)",
          gold: "var(--mapable-gold-400)",
          surface: "var(--mapable-surface)",
          "surface-blue": "var(--mapable-surface-blue)",
          primary: "var(--mapable-primary)",
          "primary-hover": "var(--mapable-primary-hover)",
          "primary-strong": "var(--mapable-primary-strong)",
          violet: "var(--mapable-violet)",
          orange: "var(--mapable-orange)",
          border: "var(--mapable-border)",
          text: "var(--mapable-text)",
          "text-muted": "var(--mapable-text-muted)",
          tagline: "var(--mapable-tagline)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "sans-serif"],
        heading: ["var(--font-heading)", "Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
};
