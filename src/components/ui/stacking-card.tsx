'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

export interface StackingCardProject {
  title: string;
  description: string;
  link: string;
  color: string;
  logo?: string;
}

interface CardProps {
  i: number;
  title: string;
  description: string;
  link: string;
  color: string;
  logo?: string;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}

const Card: React.FC<CardProps> = ({
  i,
  title,
  description,
  link,
  color,
  logo,
  progress,
  range,
  targetScale,
}) => {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start end', 'start start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [2, 1]);
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div
      ref={container}
      className="h-screen flex items-center justify-center sticky top-0 px-4"
    >
      <motion.div
        style={{
          backgroundColor: color,
          scale,
          top: `calc(-5vh + ${i * 25}px)`,
        }}
        className="flex flex-col relative -top-1/4 h-[600px] w-full max-w-7xl rounded-2xl p-8 md:p-14 origin-top shadow-2xl"
      >
        <div className="flex flex-col md:flex-row h-full gap-8 md:gap-12">
          <div className="w-full md:w-[40%] flex flex-col justify-center">
            {logo && (
              <img
                src={logo}
                alt={`${title} logo`}
                className="h-12 md:h-14 w-auto object-contain object-left mb-4 brightness-0 invert"
              />
            )}
            <p className="text-sm md:text-base text-white/95 leading-relaxed whitespace-pre-line">
              {description}
            </p>
            <div className="pt-6">
              <a
                href="/demo"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm md:text-base font-semibold text-black shadow-lg transition-transform hover:scale-105"
                style={{ color }}
              >
                Experimentar grátis
              </a>
            </div>
          </div>
          <div className="relative w-full md:w-[60%] h-[200px] md:h-full rounded-xl overflow-hidden">
            <motion.div className="w-full h-full" style={{ scale: imageScale }}>
              <img
                src={link}
                alt={title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface StackingCardsProps {
  projects: StackingCardProject[];
}

const StackingCards: React.FC<StackingCardsProps> = ({ projects }) => {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  return (
    <main ref={container} className="relative">
      {projects.map((project, i) => {
        const targetScale = 1 - (projects.length - i) * 0.05;
        return (
          <Card
            key={`p_${i}`}
            i={i}
            {...project}
            progress={scrollYProgress}
            range={[i * (1 / projects.length), 1]}
            targetScale={targetScale}
          />
        );
      })}
    </main>
  );
};

export default StackingCards;
