import { motion } from 'framer-motion';
import { CheckSquare, FileText, Calculator, Book, Calendar, Search, Lightbulb, Sparkles, TrendingUp, BarChart3, Zap } from 'lucide-react';

type Props = { iconKey: string };

const float = {
  animate: { y: [0, -10, 0] },
  transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
};

const Card: React.FC<React.PropsWithChildren> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
    transition={{
      opacity: { delay: 0.3, duration: 0.7 },
      scale: { delay: 0.3, duration: 0.7 },
      y: { delay: 1, duration: 6, repeat: Infinity, ease: 'easeInOut' },
    }}
    className="relative rounded-2xl bg-white p-6 md:p-7 border border-white/10 shadow-[0_30px_80px_-20px_rgba(255,64,0,0.35)]"
  >
    {children}
  </motion.div>
);

const Bar = ({ pct, delay = 0, label, value }: { pct: number; delay?: number; label: string; value: string }) => (
  <div>
    <div className="flex items-center justify-between text-[11px] text-[#1a1b3a] mb-1.5">
      <span className="font-medium">{label}</span>
      <span className="font-bold text-primary">{value}</span>
    </div>
    <div className="h-2 rounded-full bg-[#f5f3ef] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ delay, duration: 1.2, ease: 'easeOut' }}
        className="h-full rounded-full bg-primary"
      />
    </div>
  </div>
);

const AuditVisual = () => (
  <Card>
    <div className="flex items-center justify-between pb-4 border-b border-[#1a1b3a]/10">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1a1b3a]/50">Análise</div>
        <div className="text-lg font-bold text-[#1a1b3a]">
          Resultado: <span className="text-primary">yoursite.com</span>
        </div>
      </div>
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-full border-2 border-dashed border-primary flex items-center justify-center bg-primary/10"
      >
        <span className="text-xl font-extrabold text-primary">87</span>
      </motion.div>
    </div>
    <div className="mt-4 space-y-3">
      <Bar pct={92} delay={0.6} label="SEO" value="92" />
      <Bar pct={85} delay={0.8} label="Performance" value="85" />
      <Bar pct={78} delay={1.0} label="IA Visibility" value="78" />
      <Bar pct={64} delay={1.2} label="Conversão" value="64" />
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2">
      {[
        { k: 'Erros', v: '4' },
        { k: 'Avisos', v: '12' },
        { k: 'Ok', v: '38' },
      ].map((m) => (
        <div key={m.k} className="p-2.5 rounded-lg bg-[#0a0a0a] text-center">
          <div className="text-[10px] text-white/50 uppercase tracking-wider">{m.k}</div>
          <div className="text-base font-bold text-primary">{m.v}</div>
        </div>
      ))}
    </div>
  </Card>
);

const ChecklistVisual = () => {
  const items = ['Meta tags otimizadas', 'Títulos H1 únicos', 'Alt text em imagens', 'Sitemap XML válido', 'Core Web Vitals'];
  return (
    <Card>
      <div className="flex items-center justify-between pb-4 border-b border-[#1a1b3a]/10">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          <div className="text-lg font-bold text-[#1a1b3a]">Checklist SEO</div>
        </div>
        <div className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">50+ itens</div>
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((it, i) => (
          <motion.li
            key={it}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.15 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-[#f5f3ef] border border-[#1a1b3a]/5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + i * 0.15, type: 'spring' }}
              className="w-5 h-5 rounded-md bg-primary flex items-center justify-center flex-shrink-0"
            >
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-white fill-current"><path d="M7.5 13.5L4 10l1.4-1.4 2.1 2.1 6.1-6.1L15 6z" /></svg>
            </motion.div>
            <span className="text-sm text-[#1a1b3a] font-medium">{it}</span>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
};

const DocumentVisual = ({ title, badge }: { title: string; badge: string }) => (
  <Card>
    <div className="flex items-center justify-between pb-4 border-b border-[#1a1b3a]/10">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <div className="text-lg font-bold text-[#1a1b3a]">{title}</div>
      </div>
      <div className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{badge}</div>
    </div>
    <div className="mt-4 space-y-2.5">
      {[100, 85, 70, 92, 60, 78].map((w, i) => (
        <motion.div
          key={i}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: `${w}%`, opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
          className={`h-3 rounded-full ${i % 3 === 0 ? 'bg-primary/70' : 'bg-[#1a1b3a]/15'}`}
        />
      ))}
    </div>
    <div className="mt-5 grid grid-cols-4 gap-2">
      {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => (
        <motion.div
          key={q}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 + i * 0.1 }}
          className="p-2 rounded-lg bg-[#0a0a0a] text-center"
        >
          <div className="text-[10px] text-white/50">{q}</div>
          <div className="text-xs font-bold text-primary">{['12%', '28%', '19%', '41%'][i]}</div>
        </motion.div>
      ))}
    </div>
  </Card>
);

const CalendarVisual = () => (
  <Card>
    <div className="flex items-center justify-between pb-4 border-b border-[#1a1b3a]/10">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        <div className="text-lg font-bold text-[#1a1b3a]">Calendário Editorial</div>
      </div>
      <div className="text-[11px] font-bold text-[#1a1b3a]/60">Outubro</div>
    </div>
    <div className="mt-4 grid grid-cols-7 gap-1.5">
      {Array.from({ length: 28 }).map((_, i) => {
        const marked = [2, 5, 8, 11, 14, 17, 20, 23, 26].includes(i);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.02 }}
            className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold ${
              marked ? 'bg-primary text-white' : 'bg-[#f5f3ef] text-[#1a1b3a]/60'
            }`}
          >
            {i + 1}
          </motion.div>
        );
      })}
    </div>
    <div className="mt-4 flex items-center gap-2 text-[11px] text-[#1a1b3a]/70">
      <span className="w-2 h-2 rounded-full bg-primary" /> 9 publicações agendadas
    </div>
  </Card>
);

const CalculatorVisual = () => (
  <Card>
    <div className="flex items-center justify-between pb-4 border-b border-[#1a1b3a]/10">
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-primary" />
        <div className="text-lg font-bold text-[#1a1b3a]">Calculadora de ROI</div>
      </div>
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md"
      >
        Live
      </motion.div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      {[
        { k: 'Investimento', v: '5.000€' },
        { k: 'Receita', v: '23.400€' },
      ].map((m) => (
        <div key={m.k} className="p-3 rounded-lg bg-[#f5f3ef]">
          <div className="text-[10px] text-[#1a1b3a]/60 uppercase">{m.k}</div>
          <div className="text-lg font-bold text-[#1a1b3a]">{m.v}</div>
        </div>
      ))}
    </div>
    <div className="mt-4 p-5 rounded-xl bg-primary/10 border border-primary/20 text-center">
      <div className="text-[11px] uppercase tracking-wider text-[#1a1b3a]/60">ROI</div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
        className="text-4xl font-extrabold text-primary flex items-center justify-center gap-2"
      >
        <TrendingUp className="w-7 h-7" /> 368%
      </motion.div>
    </div>
    <div className="mt-4 flex items-end gap-2 h-16">
      {[40, 55, 35, 70, 60, 85, 95].map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ delay: 0.6 + i * 0.08, duration: 0.6 }}
          className="flex-1 rounded-t-md bg-primary/70"
        />
      ))}
    </div>
  </Card>
);

const IdeasVisual = () => {
  const ideas = ['5 hooks para Reels de moda', '10 posts sobre produtividade', 'Carrossel: mitos de SEO'];
  return (
    <Card>
      <div className="flex items-center justify-between pb-4 border-b border-[#1a1b3a]/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <div className="text-lg font-bold text-[#1a1b3a]">Ideias com IA</div>
        </div>
        <div className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">GPT · pronto</div>
      </div>
      <div className="mt-4 p-3 rounded-lg bg-[#f5f3ef] text-xs text-[#1a1b3a]/70">
        <span className="text-primary font-bold">nicho:</span> café artesanal
      </div>
      <div className="mt-3 space-y-2">
        {ideas.map((it, i) => (
          <motion.div
            key={it}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.25 }}
            className="flex items-center gap-3 p-3 rounded-lg border border-[#1a1b3a]/10 bg-white"
          >
            <Lightbulb className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-[#1a1b3a] font-medium">{it}</span>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ delay: 1.4, duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
          className="flex items-center gap-2 p-3 text-xs text-[#1a1b3a]/50"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          A gerar mais ideias...
        </motion.div>
      </div>
    </Card>
  );
};

const BookVisual = () => (
  <Card>
    <div className="flex items-center justify-between pb-4 border-b border-[#1a1b3a]/10">
      <div className="flex items-center gap-2">
        <Book className="w-5 h-5 text-primary" />
        <div className="text-lg font-bold text-[#1a1b3a]">Guia Completo</div>
      </div>
      <div className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">PDF · 48 pág.</div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.12 }}
          className="aspect-[3/4] rounded-lg bg-gradient-to-br from-[#f5f3ef] to-white border border-[#1a1b3a]/10 p-3 flex flex-col justify-between"
        >
          <div className="space-y-1.5">
            <div className="h-1.5 rounded bg-[#1a1b3a]/20 w-3/4" />
            <div className="h-1.5 rounded bg-[#1a1b3a]/10 w-1/2" />
          </div>
          <div className="text-[10px] font-bold text-primary">Cap. {i}</div>
        </motion.div>
      ))}
    </div>
  </Card>
);

const ResourceHeroVisual: React.FC<Props> = ({ iconKey }) => {
  switch (iconKey) {
    case 'CheckSquare':
      return <ChecklistVisual />;
    case 'FileText':
      return <DocumentVisual title="Plano de Marketing" badge="Editável" />;
    case 'Calculator':
      return <CalculatorVisual />;
    case 'Book':
      return <BookVisual />;
    case 'Calendar':
      return <CalendarVisual />;
    case 'Lightbulb':
      return <IdeasVisual />;
    case 'Search':
    default:
      return <AuditVisual />;
  }
};

export default ResourceHeroVisual;
