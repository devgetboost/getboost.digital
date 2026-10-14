import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Getboost 2027 — Wave 3A · SectionHeader · R22 editorial revision.
 *
 * Same API (eyebrow → title → description → proof, as/align control), new
 * voice: numbered-kicker rhythm with a hairline rule and an oversized
 * display title where <em> renders in Instrument Serif italic. One edit
 * here re-voices every section on the platform.
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
          <span className={`ed-kicker w-full ${align === "center" ? "justify-center ed-kicker-center" : ""}`}>
            <span className="gb-eyebrow text-ink-secondary">{eyebrow}</span>
          </span>
        ) : null}
        {/* R18.8 — frozen vertical rhythm: eyebrow ↓ title 24 · title ↓ desc 24 · desc ↓ content 48 (content spacing lives in sections). */}
        <Heading
          className={`ed-display mt-6 text-ink-primary text-[clamp(2.25rem,4.5vw,4rem)] ${
            align === "center" ? "text-center text-balance" : ""
          }`}
        >
          {title}
        </Heading>
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
