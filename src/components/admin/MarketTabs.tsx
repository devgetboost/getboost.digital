import { ADMIN_MARKETS, MARKET_LABELS, type MarketCode } from '@/lib/adminContent';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * R1C8 — market selector shared by every admin content surface.
 *
 * Clean V1 localizes content per market, so an admin always works inside one
 * market at a time. `value` may also be `'all'` for list filtering; the editor
 * always passes a concrete market.
 */
export default function MarketTabs({
  value,
  onChange,
  allowAll = true,
  className,
}: {
  value: MarketCode | 'all';
  onChange: (market: MarketCode | 'all') => void;
  allowAll?: boolean;
  className?: string;
}) {
  const options: (MarketCode | 'all')[] = allowAll ? ['all', ...ADMIN_MARKETS] : [...ADMIN_MARKETS];
  return (
    <div className={cn('inline-flex rounded-md border border-border bg-background p-0.5', className)}>
      {options.map((option) => (
        <Button
          key={option}
          size="sm"
          variant={value === option ? 'secondary' : 'ghost'}
          onClick={() => onChange(option)}
          className="h-8 px-2.5 gap-1.5"
        >
          {option === 'all' ? 'Todos' : `${option} · ${MARKET_LABELS[option]}`}
        </Button>
      ))}
    </div>
  );
}
