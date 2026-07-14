"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "light" | "dark" | "accent";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  variant: Variant;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "A GetBoost transformou por completo a nossa presença digital. Serviço top e uma equipa incrivelmente responsiva.",
    name: "Guillermo Rauch",
    role: "CEO · Enigma",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=60",
    variant: "light",
  },
  {
    quote: "Vimos resultados incríveis com a GetBoost. Estratégia, criatividade e dedicação em cada detalhe.",
    name: "Rika Shinoda",
    role: "CEO · Kintsugi",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=60",
    variant: "accent",
  },
  {
    quote:
      "Equipa altamente profissional — as soluções que apresentaram transformaram por completo a forma como operamos.",
    name: "André Reacher",
    role: "CEO · OdeaoLabs",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&auto=format&fit=crop&q=60",
    variant: "dark",
  },
  {
    quote: "Estamos extremamente satisfeitos. A dedicação e o know-how superaram todas as nossas expectativas.",
    name: "João Martins",
    role: "Founder · Labsbo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60",
    variant: "dark",
  },
  {
    quote: "Suporte absolutamente excepcional. Estão sempre disponíveis e são incrivelmente prestáveis.",
    name: "Steven Sunny",
    role: "CEO · Boxefi",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=60",
    variant: "dark",
  },
  {
    quote: "A GetBoost tem sido uma parceira-chave na nossa jornada de crescimento.",
    name: "Guillermo Rauch",
    role: "CEO · OdeaoLabs",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=60",
    variant: "accent",
  },
  {
    quote:
      "A GetBoost é uma verdadeira game-changer. Serviço excepcional, expertise profunda e compromisso com a excelência — o impacto no nosso negócio é evidente.",
    name: "Paulo Brandão",
    role: "CTO · Spectrum",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=60",
    variant: "light",
  },
];

const GridPattern = () => (
  <div
    aria-hidden
    className="absolute inset-0 opacity-[0.35] pointer-events-none"
    style={{
      backgroundImage:
        "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)",
      backgroundSize: "44px 44px",
    }}
  />
);

const Card = ({ t, i }: { t: Testimonial; i: number }) => {
  const styles: Record<Variant, string> = {
    light: "bg-white text-foreground border border-border",
    dark: "bg-[#0a0a0a] text-white",
    accent: "bg-primary text-primary-foreground",
  };

  const roleClass =
    t.variant === "light" ? "text-muted-foreground" : "text-white/75";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-7 mb-6 break-inside-avoid",
        styles[t.variant],
      )}
    >
      {t.variant === "light" && <GridPattern />}

      <div className="relative">
        <p className="text-base md:text-lg leading-relaxed">"{t.quote}"</p>

        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <div className="text-lg font-bold leading-tight">{t.name}</div>
            <div className={cn("text-sm mt-1", roleClass)}>{t.role}</div>
          </div>
          <img
            src={t.avatar}
            alt={t.name}
            loading="lazy"
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        </div>
      </div>
    </motion.article>
  );
};

export default function ClientFeedback() {
  return (
    <section className="section-padding bg-section-alt">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            A confiança de startups e das <span className="text-primary">maiores marcas</span>
          </h2>
          <p className="text-muted-foreground mt-3">
            Ouve o que os clientes da GetBoost dizem sobre o nosso serviço.
          </p>
        </motion.div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
          {TESTIMONIALS.map((t, i) => (
            <Card key={t.name + i} t={t} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
