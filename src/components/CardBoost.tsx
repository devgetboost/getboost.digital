import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardBoostProps extends HTMLAttributes<HTMLDivElement> {
  /** Disable hover translate/shadow effect */
  noHover?: boolean;
  /** Render as a different element (e.g. "article", "section") */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Reusable card with the Boost border/shadow style.
 * Applies `.card-boost` (+ `.card-boost-hover` unless disabled).
 */
const CardBoost = forwardRef<HTMLDivElement, CardBoostProps>(
  ({ className, noHover = false, as, children, ...props }, ref) => {
    const Comp = (as || "div") as React.ElementType;
    return (
      <Comp
        ref={ref}
        className={cn(
          "card-boost",
          !noHover && "card-boost-hover",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

CardBoost.displayName = "CardBoost";

export default CardBoost;
