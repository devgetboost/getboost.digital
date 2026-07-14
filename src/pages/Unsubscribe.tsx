import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, AlertTriangle, Loader2, MailX } from 'lucide-react';

type Status = 'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error';

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (!res.ok) { setStatus('invalid'); return; }
        if (data.valid === false && data.reason === 'already_unsubscribed') {
          setStatus('already');
        } else if (data.valid) {
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      } catch { setStatus('error'); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      setStatus(error ? 'error' : 'success');
    } catch { setStatus('error'); }
    setSubmitting(false);
  };

  const content: Record<Status, { icon: React.ReactNode; title: string; desc: string }> = {
    loading: { icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />, title: 'A verificar...', desc: '' },
    valid: { icon: <MailX className="h-8 w-8 text-primary" />, title: 'Cancelar subscrição', desc: 'Tem a certeza de que pretende deixar de receber os nossos emails?' },
    already: { icon: <Check className="h-8 w-8 text-green-500" />, title: 'Já cancelou a subscrição', desc: 'Este email já foi removido da nossa lista de envio.' },
    success: { icon: <Check className="h-8 w-8 text-green-500" />, title: 'Subscrição cancelada', desc: 'Não receberá mais emails da nossa parte.' },
    invalid: { icon: <AlertTriangle className="h-8 w-8 text-destructive" />, title: 'Link inválido', desc: 'Este link de cancelamento não é válido ou já expirou.' },
    error: { icon: <AlertTriangle className="h-8 w-8 text-destructive" />, title: 'Erro', desc: 'Algo correu mal. Por favor, tente novamente mais tarde.' },
  };

  const c = content[status];

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full border border-border shadow-none">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              {c.icon}
            </div>
            <h1 className="text-xl font-bold mb-2">{c.title}</h1>
            <p className="text-muted-foreground text-sm mb-6">{c.desc}</p>
            {status === 'valid' && (
              <Button onClick={handleUnsubscribe} disabled={submitting} className="w-full rounded-xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar cancelamento
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Unsubscribe;
