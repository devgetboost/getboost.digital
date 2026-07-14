"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedMarqueeHeroProps {
  tagline: string;
  title: React.ReactNode;
  description: string;
  ctaText: string;
  ctaHref?: string;
  images: string[];
  className?: string;
}

const FADE_IN_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

export const AnimatedMarqueeHero: React.FC<AnimatedMarqueeHeroProps> = ({
  tagline,
  title,
  description,
  ctaText,
  ctaHref = "#",
  images,
  className,
}) => {
  const duplicatedImages = [...images, ...images];

  return (
    <section className={cn("relative w-full overflow-hidden bg-background pt-28 md:pt-36", className)}>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        className="relative z-10 mx-auto max-w-5xl px-6 text-center"
      >
        <motion.p
          variants={FADE_IN_ANIMATION_VARIANTS}
          className="text-sm font-semibold uppercase tracking-widest text-primary"
        >
          {tagline}
        </motion.p>

        <motion.h1
          variants={FADE_IN_ANIMATION_VARIANTS}
          className="mt-4 text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-foreground"
        >
          {title}
        </motion.h1>

        <motion.p
          variants={FADE_IN_ANIMATION_VARIANTS}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          {description}
        </motion.p>

        <motion.div variants={FADE_IN_ANIMATION_VARIANTS} className="mt-8 flex justify-center">
          <a
            href={ctaHref}
            className="relative z-20 inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
          >
            {ctaText}
          </a>
        </motion.div>
      </motion.div>

      {/* Marquee */}
      <div className="relative -mt-8 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <motion.div
          className="flex gap-6 py-10"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        >
          {duplicatedImages.map((src, index) => (
            <div
              key={index}
              className="relative h-64 w-52 shrink-0 overflow-hidden rounded-2xl md:h-80 md:w-64"
              style={{ transform: `rotate(${index % 2 === 0 ? -3 : 3}deg)` }}
            >
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AnimatedMarqueeHero;
