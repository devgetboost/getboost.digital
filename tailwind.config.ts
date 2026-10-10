import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
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
        "section-alt": "hsl(var(--section-alt))",
        // Getboost 2027 design system (Wave 3A) — frozen tokens from
        // GETBOOST_2027_DESIGN_FREEZE_V1, mirrored from
        // src/styles/design-system.css. Additive: built-in ramps untouched.
        brand: {
          50: "var(--gb-brand-50)",
          100: "var(--gb-brand-100)",
          200: "var(--gb-brand-200)",
          300: "var(--gb-brand-300)",
          400: "var(--gb-brand-400)",
          500: "var(--gb-brand-500)",
          600: "var(--gb-brand-600)",
          700: "var(--gb-brand-700)",
        },
        sand: {
          0: "var(--gb-sand-0)",
          50: "var(--gb-sand-50)",
          100: "var(--gb-sand-100)",
          200: "var(--gb-sand-200)",
          300: "var(--gb-sand-300)",
          400: "var(--gb-sand-400)",
          500: "var(--gb-sand-500)",
          600: "var(--gb-sand-600)",
          700: "var(--gb-sand-700)",
          800: "var(--gb-sand-800)",
          900: "var(--gb-sand-900)",
          950: "var(--gb-sand-950)",
        },
        canvas: {
          base: "var(--gb-canvas-base)",
          subtle: "var(--gb-canvas-subtle)",
          section: "var(--gb-canvas-section)",
          tint: "var(--gb-canvas-tint)",
          inverse: "var(--gb-canvas-inverse)",
        },
        ink: {
          primary: "var(--gb-ink-primary)",
          secondary: "var(--gb-ink-secondary)",
          tertiary: "var(--gb-ink-tertiary)",
          inverse: "var(--gb-ink-inverse)",
          "on-brand": "var(--gb-ink-on-brand)",
        },
        success: "var(--gb-success)",
        warning: "var(--gb-warning)",
        error: "var(--gb-error)",
        ai: {
          base: "var(--gb-ai-base)",
          strong: "var(--gb-ai-strong)",
          tint: "var(--gb-ai-tint)",
          border: "var(--gb-ai-border)",
        },
        automation: {
          base: "var(--gb-automation-base)",
          strong: "var(--gb-automation-strong)",
          tint: "var(--gb-automation-tint)",
          border: "var(--gb-automation-border)",
        },
        software: {
          base: "var(--gb-software-base)",
          strong: "var(--gb-software-strong)",
          tint: "var(--gb-software-tint)",
          border: "var(--gb-software-border)",
        },
        growth: {
          base: "var(--gb-growth-base)",
          strong: "var(--gb-growth-strong)",
          tint: "var(--gb-growth-tint)",
          border: "var(--gb-growth-border)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        admin: {
          surface: "hsl(var(--admin-surface))",
          border: "hsl(var(--admin-border))",
          fg: "hsl(var(--admin-fg))",
          "fg-muted": "hsl(var(--admin-fg-muted))",
          "fg-subtle": "hsl(var(--admin-fg-subtle))",
          hover: "hsl(var(--admin-hover))",
          active: "hsl(var(--admin-active))",
          "active-bar": "hsl(var(--admin-active-bar))",
        },
      },
      fontSize: {
        // Frozen type scale (Wave 3A) — GETBOOST_2027_DESIGN_FREEZE_V1.
        display: ["3.5rem", { lineHeight: "4rem", letterSpacing: "-0.025em", fontWeight: "900" }],
        h1: ["2.75rem", { lineHeight: "3.25rem", letterSpacing: "-0.02em", fontWeight: "800" }],
        h2: ["2rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em", fontWeight: "700" }],
        h3: ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.01em", fontWeight: "700" }],
        body: ["1rem", { lineHeight: "1.625rem" }],
        small: ["0.875rem", { lineHeight: "1.375rem" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Frozen surface elevation (Wave 3A).
        "card-rest": "var(--gb-shadow-rest)",
        "card-hover": "var(--gb-shadow-hover)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "marquee-x": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "marquee-x": "marquee-x 40s linear infinite",
      },

    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
