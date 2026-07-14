import { useTranslation } from 'react-i18next';
import { analytics } from '@/lib/analytics';
import { Button, ButtonProps } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StandardCTAProps extends ButtonProps {
  i18nKey: string;
  href?: string;
  category: string;
  ctaType: string;
  funnelStage?: 'awareness' | 'consideration' | 'conversion';
  onClick?: () => void;
  icon?: LucideIcon;
  children?: ReactNode;
  showArrow?: boolean;
}

const CTA_SURFACE_STYLES =
  "border border-border bg-background text-foreground shadow-sm hover:bg-secondary hover:text-foreground hover:shadow-xl";

const CTA_OUTLINE_ON_DARK_STYLES =
  "border border-white/35 bg-white/10 text-white shadow-sm backdrop-blur-sm hover:bg-white hover:text-foreground hover:border-white";

export const StandardCTA = ({ 
  i18nKey, 
  href, 
  category, 
  ctaType, 
  funnelStage = 'consideration', 
  onClick,
  icon: Icon,
  children,
  showArrow = false,
  className,
  ...props 
}: StandardCTAProps) => {
  const { t, i18n } = useTranslation();

  const handleClick = () => {
    // Tracking with type and language
    analytics.trackClick(category, `${ctaType}_${i18nKey}`, funnelStage, {
      language: i18n.language,
      cta_type: ctaType,
      i18n_key: i18nKey
    });
    if (onClick) onClick();
  };

  const label = children || t(i18nKey);
  const normalizedClassName = typeof className === 'string' ? className : '';
  const hasInlineTextColor = Boolean(props.style && 'color' in props.style);
  const hasSurfaceOverride = /(?:^|\s)(?:bg-|text-|border-)/.test(normalizedClassName) || Boolean(props.style);
  const isOutlineOnDark = props.variant === 'outline' && /(?:^|\s)(?:text-white|border-white)/.test(normalizedClassName);
  const visibilityClasses = cn(
    !hasSurfaceOverride && CTA_SURFACE_STYLES,
    isOutlineOnDark && CTA_OUTLINE_ON_DARK_STYLES,
    !hasInlineTextColor && "[&_svg]:text-current"
  );

  // Arrow is wrapped in its own span so it can animate independently of the label
  const renderContent = () => (
    <>
      {Icon && (
        <span className="inline-flex shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1">
          <Icon className="mr-2 h-4 w-4 shrink-0" />
        </span>
      )}
      <span className="truncate">{label}</span>
      {showArrow && !Icon && (
        <span
          aria-hidden="true"
          className="ml-2 inline-flex shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </span>
      )}
    </>
  );

  // Premium micro-interaction shared by every CTA
  const interactionClasses =
    "group transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.99]";

  const ctaClassName = cn(visibilityClasses, interactionClasses, className);

  if (href) {
    if (href.startsWith('#')) {
      return (
        <Button 
          variant={props.variant || "default"}
          size={props.size || "default"}
          {...props} 
          className={ctaClassName}
          onClick={(e) => {
            handleClick();
            const el = document.getElementById(href.substring(1));
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {renderContent()}
        </Button>
      );
    }
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return (
        <Button 
          asChild 
          variant={props.variant || "default"}
          size={props.size || "default"}
          className={ctaClassName} 
          {...props}
        >
          <a href={href} onClick={handleClick} target={href.startsWith('http') ? "_blank" : undefined} rel={href.startsWith('http') ? "noopener noreferrer" : undefined}>
            {renderContent()}
          </a>
        </Button>
      );
    }
    return (
      <Button 
        asChild 
        variant={props.variant || "default"}
        size={props.size || "default"}
        className={ctaClassName} 
        {...props}
      >
        <Link to={href} onClick={handleClick}>
          {renderContent()}
        </Link>
      </Button>
    );
  }

  return (
    <Button 
      variant={props.variant || "default"}
      size={props.size || "default"}
      {...props} 
      className={ctaClassName} 
      onClick={handleClick}
    >
      {renderContent()}
    </Button>
  );
};

