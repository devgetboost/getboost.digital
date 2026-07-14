import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Trash2, ArrowRight, FileText } from 'lucide-react';
import { getAudits, deleteAudit, clearAudits, type StoredAudit } from '@/lib/auditHistory';
import CommercialAuditModal from './CommercialAuditModal';

const ACCENT = '#ff4000';

interface Props {
  open: boolean;
  onClose: () => void;
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

const AuditHistoryModal = ({ open, onClose }: Props) => {
  const [items, setItems] = useState<StoredAudit[]>([]);
  const [selected, setSelected] = useState<StoredAudit | null>(null);

  useEffect(() => {
    if (open) setItems(getAudits());
  }, [open]);

  const refresh = () => setItems(getAudits());

  const handleDelete = (id: string) => {
    deleteAudit(id);
    refresh();
  };

  const handleClear = () => {
    if (confirm('Apagar todo o histórico de auditorias?')) {
      clearAudits();
      refresh();
    }
  };

  if (!open) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 md:p-8 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl my-auto rounded-2xl border border-white/10 bg-[#0a0603] text-white shadow-[0_20px_80px_-20px_rgba(255,64,0,0.5)] overflow-hidden"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,64,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.4) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                maskImage: 'radial-gradient(ellipse at 80% 0%, black 10%, transparent 60%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 80% 0%, black 10%, transparent 60%)',
              }}
            />

            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative p-6 md:p-10">
              <div className="flex items-center gap-3 mb-2">
                <History className="h-4 w-4" style={{ color: ACCENT }} />
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/60">
                  Histórico de auditorias
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
                As tuas auditorias comerciais
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Guardadas neste dispositivo. Clica para reabrir o relatório completo.
              </p>

              {items.length === 0 ? (
                <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
                  <FileText className="h-8 w-8 mx-auto text-white/30" />
                  <p className="mt-4 text-white/70">Ainda não tens auditorias guardadas.</p>
                  <p className="mt-1 text-xs text-white/40">Faz a Auditoria Comercial de 7 minutos para começar.</p>
                </div>
              ) : (
                <>
                  <ul className="mt-8 space-y-3">
                    {items.map((a) => (
                      <li
                        key={a.id}
                        className="group rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#ff4000]/40 hover:bg-white/[0.04] transition-all"
                      >
                        <div className="flex items-center gap-4 p-4">
                          <div className="shrink-0 h-14 w-14 rounded-full border border-[#ff4000]/40 flex flex-col items-center justify-center">
                            <span className="text-lg font-black" style={{ color: ACCENT }}>{a.report.score}</span>
                            <span className="text-[9px] text-white/40 -mt-0.5">/100</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelected(a)}
                            className="flex-1 text-left"
                          >
                            <div className="text-sm font-semibold text-white line-clamp-1">
                              {a.contact.company || a.contact.name}
                            </div>
                            <div className="text-[11px] font-mono uppercase tracking-widest text-white/50 mt-0.5">
                              {formatDate(a.createdAt)}
                            </div>
                            <div className="text-xs text-white/60 mt-1.5 line-clamp-1">{a.report.verdict}</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelected(a)}
                            className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/60 hover:text-white"
                          >
                            Ver <ArrowRight className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
                            aria-label="Apagar"
                            className="rounded-full p-2 text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 hover:text-red-400 transition-colors"
                    >
                      Apagar histórico
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <CommercialAuditModal
        open={!!selected}
        onClose={() => setSelected(null)}
        preloaded={selected}
      />
    </>
  );
};

export default AuditHistoryModal;
