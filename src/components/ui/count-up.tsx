import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

/**
 * R18.7 — KPI count-up. Parses a display value into prefix + number +
 * suffix ("+300%" → ["+", 300, "%"]; "−70%" keeps its U+2212 prefix;
 * "24/7" is not countable and renders static), animates 0 → target once
 * when entering the viewport, and jumps straight to the final value under
 * prefers-reduced-motion.
 */
const parseValue = (value: string): { prefix: string; target: number; suffix: string; countable: boolean } => {
  const match = value.match(/^([^0-9]*)([0-9]+(?:[.,][0-9]+)?)(.*)$/);
  if (!match) return { prefix: '', target: 0, suffix: value, countable: false };
  const [, prefix, raw, suffix] = match;
  // Fractions ("24/7") are not countable — render them static.
  if (suffix.includes('/')) return { prefix: '', target: 0, suffix: value, countable: false };
  return { prefix, target: Number(raw.replace(',', '.')), suffix, countable: true };
};

const decimalsOf = (value: string): number => {
  const match = value.match(/[0-9]+(?:[.,]([0-9]+))?/);
  return match?.[1]?.length ?? 0;
};

export const CountUp = ({
  value,
  className,
  duration = 1.6,
}: {
  value: string;
  className?: string;
  duration?: number;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px 0px 0px' });
  const reduce = useReducedMotion() ?? false;
  const parsed = parseValue(value);
  const [display, setDisplay] = useState(value);

  // Non-countable values never animate — keep them in sync with the prop.
  useEffect(() => {
    if (!parsed.countable) setDisplay(value);
  }, [value, parsed.countable]);

  useEffect(() => {
    if (!inView || !parsed.countable) return;
    if (reduce || duration <= 0) {
      setDisplay(value);
      return;
    }
    const decimals = decimalsOf(value);
    const controls = animate(0, parsed.target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(`${parsed.prefix}${v.toFixed(decimals)}${parsed.suffix}`),
    });
    return () => controls.stop();
  }, [inView, reduce, duration, value, parsed.countable, parsed.prefix, parsed.suffix, parsed.target]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
};
