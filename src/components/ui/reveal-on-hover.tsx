import * as React from 'react';
import { cn } from '@/lib/utils';

export const CardHoverReveal = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('group relative overflow-hidden', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
CardHoverReveal.displayName = 'CardHoverReveal';

export const CardHoverRevealMain = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'size-full transition-transform duration-500 group-hover:scale-105',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
CardHoverRevealMain.displayName = 'CardHoverRevealMain';

export const CardHoverRevealContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'absolute inset-x-3 bottom-3 translate-y-[calc(100%-0px)] opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
CardHoverRevealContent.displayName = 'CardHoverRevealContent';
