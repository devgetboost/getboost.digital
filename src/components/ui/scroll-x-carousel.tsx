import * as React from 'react';
import { motion, useScroll, useTransform, useMotionValue, type MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

type ScrollCtx = { progress: MotionValue<number> };
const Ctx = React.createContext<ScrollCtx | null>(null);

interface ScrollXCarouselProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ScrollXCarousel = React.forwardRef<HTMLDivElement, ScrollXCarouselProps>(
  ({ className, children, ...props }, ref) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);
    const { scrollYProgress } = useScroll({
      target: localRef,
      offset: ['start start', 'end end'],
    });
    return (
      <Ctx.Provider value={{ progress: scrollYProgress }}>
        <div ref={localRef} className={cn('relative', className)} {...props}>
          {children}
        </div>
      </Ctx.Provider>
    );
  },
);
ScrollXCarousel.displayName = 'ScrollXCarousel';

export const ScrollXCarouselContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('sticky top-0 overflow-hidden', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
ScrollXCarouselContainer.displayName = 'ScrollXCarouselContainer';

interface ScrollXCarouselWrapProps extends React.HTMLAttributes<HTMLDivElement> {
  xRagnge?: [string, string];
}

export const ScrollXCarouselWrap = React.forwardRef<HTMLDivElement, ScrollXCarouselWrapProps>(
  ({ className, children, xRagnge = ['5%', '-70%'], ...props }, ref) => {
    const ctx = React.useContext(Ctx);
    const fallback = useMotionValue(0);
    const x = useTransform(ctx?.progress ?? fallback, [0, 1], xRagnge);
    return (
      <motion.div ref={ref} style={{ x }} className={cn(className)} {...(props as any)}>
        {children}
      </motion.div>
    );
  },
);
ScrollXCarouselWrap.displayName = 'ScrollXCarouselWrap';

interface ScrollXCarouselProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  progressStyle?: string;
}

export const ScrollXCarouselProgress = React.forwardRef<HTMLDivElement, ScrollXCarouselProgressProps>(
  ({ className, progressStyle, ...props }, ref) => {
    const ctx = React.useContext(Ctx);
    const fallback = useMotionValue(0);
    const scaleX = useTransform(ctx?.progress ?? fallback, [0, 1], [0, 1]);
    return (
      <div ref={ref} className={cn(className)} {...props}>
        <motion.div style={{ scaleX, transformOrigin: '0% 50%' }} className={cn(progressStyle)} />
      </div>
    );
  },
);
ScrollXCarouselProgress.displayName = 'ScrollXCarouselProgress';
