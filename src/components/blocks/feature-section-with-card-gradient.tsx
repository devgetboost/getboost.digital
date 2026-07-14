import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface CardGradientFeature {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface Props {
  features: CardGradientFeature[];
  className?: string;
}

export function FeaturesSectionWithCardGradient({ features, className }: Props) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto",
        className,
      )}
    >
      {features.map((f) => (
        <Card key={f.title} {...f} />
      ))}
    </div>
  );
}

function Card({ title, description, icon: Icon }: CardGradientFeature) {
  return (
    <div className="group relative p-[2px] rounded-2xl overflow-hidden bg-neutral-200/60 hover:bg-transparent transition-colors">
      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[conic-gradient(from_90deg_at_50%_50%,hsl(var(--primary))_0%,transparent_50%,hsl(var(--primary))_100%)]" />

      <div className="relative rounded-2xl bg-white h-full p-6 flex flex-col overflow-hidden">
        {/* Radial gradient glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="relative z-10 font-bold mb-2 text-neutral-900">{title}</h3>
        <p className="relative z-10 text-sm text-neutral-600">{description}</p>
      </div>
    </div>
  );
}
