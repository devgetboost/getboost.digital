import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Getboost 2027 — Wave 3A · SectionHeader
 *
 * The single reusable section header for the design system:
 * eyebrow (mono, brand) → title → description → optional proof line.
 * Renders on the frozen type scale (gb-text-* / gb-eyebrow) so every
 * section across the site shares one rhythm.
 */

export type SectionHeaderAlign = "left" | "center";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Small mono label above the title. */
  eyebrow?: React.ReactNode;
  /** The heading itself. */
  title: React.ReactNode;
  /** Supporting copy under the title. */
  description?: React.ReactNode;
  /** Optional proof line (metric, source, qualifier) under the description. */
  proof?: React.ReactNode;
  /** Heading level — keeps document outlines correct per section. */
  as?: "h1" | "h2" | "h3";
  align?: SectionHeaderAlign;
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, eyebrow, title, description, proof, as = "h2", align = "left", ...props }, ref) => {
    const Heading = as;
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col",
          align === "center" && "items-center text-center",
          className,
        )}
        {...props}
      >
        {eyebrow ? (
          <span className="gb-eyebrow text-brand-600">{eyebrow}</span>
        ) : null}
        {/* R18.8 — frozen vertical rhythm: eyebrow ↓ title 24 · title ↓ desc 24 · desc ↓ content 48 (content spacing lives in sections). */}
        <Heading className="gb-text-h2 mt-6 text-ink-primary">{title}</Heading>
        {description ? (
          <p
            className={cn(
              "gb-text-body mt-6 max-w-2xl text-ink-secondary",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        ) : null}
        {proof ? (
          <p
            className={cn(
              "gb-text-small mt-3 max-w-2xl text-ink-tertiary",
              align === "center" && "mx-auto",
            )}
          >
            {proof}
          </p>
        ) : null}
      </div>
    );
  },
);
SectionHeader.displayName = "SectionHeader";

export { SectionHeader };
