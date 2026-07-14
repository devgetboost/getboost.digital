import { motion } from 'framer-motion';

/**
 * Divisor no fundo das secções hero: um único mergulho central largo
 * (curva em "V" suavizada) com respiração lenta. Usado em PageHero e
 * HeroCarousel para consistência visual.
 *
 * Cor: usa `fill-current`, portanto herda a cor do texto do wrapper.
 * Por defeito é `text-background` — ou seja, herda o fundo da secção
 * seguinte (a app usa `bg-background` no conteúdo). Para casos em que
 * a secção seguinte tem outra cor, basta passar `className="text-white"`
 * (ou outra classe de cor) no local onde é usado.
 */
type HeroWaveDividerProps = {
  className?: string;
};

const HeroWaveDivider = ({ className = 'text-background' }: HeroWaveDividerProps) => (
  <div
    className={`pointer-events-none absolute inset-x-0 bottom-0 z-[5] leading-[0] ${className}`}
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 1440 180"
      preserveAspectRatio="none"
      className="block w-full h-[110px] md:h-[160px]"
    >
      {/*
        Mergulho central bem largo e profundo (as âncoras nos x=380 e x=1060
        alargam a boca do "V"; y=170 aproxima o vértice ao fundo).
        Interpola entre duas variações equivalentes para animar suavemente.
      */}
      <motion.path
        fill="currentColor"
        initial={false}
        animate={{
          d: [
            'M0,180 L0,40 C 200,40 320,40 380,40 C 560,40 660,170 720,170 C 780,170 880,40 1060,40 C 1120,40 1240,40 1440,40 L 1440,180 Z',
            'M0,180 L0,40 C 200,40 320,40 380,40 C 560,40 665,158 720,158 C 775,158 880,40 1060,40 C 1120,40 1240,40 1440,40 L 1440,180 Z',
            'M0,180 L0,40 C 200,40 320,40 380,40 C 560,40 660,170 720,170 C 780,170 880,40 1060,40 C 1120,40 1240,40 1440,40 L 1440,180 Z',
          ],
        }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
      />
    </svg>
  </div>
);

export default HeroWaveDivider;
