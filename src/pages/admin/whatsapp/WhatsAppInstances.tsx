import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Wifi, WifiOff, RefreshCw, Eye, EyeOff, QrCode, LogOut, Loader2 } from 'lucide-react';

type Instance = {
  id: string;
  name: string;
  server_url: string;
  api_key: string;
  instance_name: string;
  status: string;
  qrcode_base64: string | null;
  qrcode_expires_at: string | null;
  pairing_code: string | null;
  last_connected_at: string | null;
  webhook_configured: boolean;
  connected_number: string | null;
};

async function callProxy(action: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-proxy?action=${action}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'online') {
    return <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-600"><Wifi className="h-3 w-3" /> Conectado</Badge>;
  }
  if (status === 'connecting') {
    return <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-700"><Loader2 className="h-3 w-3 animate-spin" /> A conectar</Badge>;
  }
  return <Badge variant="secondary" className="gap-1"><WifiOff className="h-3 w-3" /> Desconectado</Badge>;
}

function QrCodeDialog({ instance, open, onClose }: { instance: Instance | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Initial QR fetch when dialog opens
  useEffect(() => {
    if (!open || !instance) return;
    setQrcode(instance.qrcode_base64);
    setCountdown(60);
  }, [open, instance?.id]);

  // Countdown timer
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [open]);

  // Poll connection state every 3s while open
  useEffect(() => {
    if (!open || !instance) return;
    const poll = setInterval(async () => {
      try {
        const result = await callProxy('connection-state', { instance_id: instance.id });
        if (result.status === 'online') {
          toast.success('WhatsApp conectado!');
          qc.invalidateQueries({ queryKey: ['whatsapp-instances'] });
          onClose();
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(poll);
  }, [open, instance?.id]);

  const refresh = async () => {
    if (!instance) return;
    setRefreshing(true);
    try {
      const r = await callProxy('connect-instance', { instance_id: instance.id });
      setQrcode(r.qrcode);
      setCountdown(60);
      qc.invalidateQueries({ queryKey: ['whatsapp-instances'] });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar QR');
    } finally {
      setRefreshing(false);
    }
  };

  const qrSrc = qrcode?.startsWith('data:') ? qrcode : qrcode ? `data:image/png;base64,${qrcode}` : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ligar WhatsApp — {instance?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Abra o WhatsApp no telemóvel → Definições → Aparelhos ligados → Ligar um aparelho, e leia o código abaixo.
          </p>
          <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/30 min-h-[280px]">
            {qrSrc ? (
              <img src={qrSrc} alt="QR Code WhatsApp" className="w-64 h-64 object-contain" />
            ) : refreshing ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Sem código QR.<br />Clique em "Gerar novo QR".
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{countdown > 0 ? `Expira em ${countdown}s` : 'QR expirado'}</span>
            <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> A aguardar leitura...</span>
          </div>
          <Button onClick={refresh} disabled={refreshing} variant="outline" className="w-full gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Gerar novo QR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WhatsAppInstances() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [qrInstance, setQrInstance] = useState<Instance | null>(null);
  const [form, setForm] = useState({ name: '', server_url: '', api_key: '', instance_name: '' });

  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['whatsapp-instances'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whatsapp_instances').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Instance[];
    },
    refetchInterval: 10000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from('whatsapp_instances').insert(form).select().single();
      if (error) throw error;
      // Create the instance on Evolution server
      try {
        const r = await callProxy('create-instance', { instance_id: data.id });
        return { ...data, qrcode_base64: r.qrcode } as Instance;
      } catch (e: any) {
        toast.warning(`Instância gravada mas falhou ao criar no servidor Evolution: ${e.message}`);
        return data as Instance;
      }
    },
    onSuccess: (inst) => {
      toast.success('Instância criada');
      qc.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      setOpen(false);
      setForm({ name: '', server_url: '', api_key: '', instance_name: '' });
      if (inst.qrcode_base64) setQrInstance(inst);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await callProxy('delete-instance', { instance_id: id }).catch(() => null);
    },
    onSuccess: () => {
      toast.success('Instância removida');
      qc.invalidateQueries({ queryKey: ['whatsapp-instances'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logoutMutation = useMutation({
    mutationFn: async (id: string) => await callProxy('logout-instance', { instance_id: id }),
    onSuccess: () => {
      toast.success('WhatsApp desligado');
      qc.invalidateQueries({ queryKey: ['whatsapp-instances'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reconnect = async (inst: Instance) => {
    try {
      const r = await callProxy('connect-instance', { instance_id: inst.id });
      setQrInstance({ ...inst, qrcode_base64: r.qrcode });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao reconectar');
    }
  };

  const setWebhook = async (inst: Instance) => {
    toast.loading('A configurar webhook...', { id: 'webhook' });
    try {
      await callProxy('set-webhook', { instance_id: inst.id });
      toast.success('Webhook configurado', { id: 'webhook' });
      qc.invalidateQueries({ queryKey: ['whatsapp-instances'] });
    } catch (e: any) {
      toast.error(e.message || 'Erro no webhook', { id: 'webhook' });
    }
  };

  const checkStatus = async (inst: Instance) => {
    toast.loading('A verificar...', { id: 'check' });
    try {
      const r = await callProxy('connection-state', { instance_id: inst.id });
      toast.success(`Estado: ${r.status}`, { id: 'check' });
      qc.invalidateQueries({ queryKey: ['whatsapp-instances'] });
    } catch (e: any) {
      toast.error(e.message || 'Erro', { id: 'check' });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Instâncias Evolution API</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Nova Instância</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Instância</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome interno</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Produção" /></div>
              <div><Label>URL do Servidor Evolution</Label><Input value={form.server_url} onChange={e => setForm(f => ({ ...f, server_url: e.target.value }))} placeholder="https://evolution.exemplo.com" /></div>
              <div><Label>Nome da Instância (Evolution)</Label><Input value={form.instance_name} onChange={e => setForm(f => ({ ...f, instance_name: e.target.value }))} placeholder="nome-da-instancia" /></div>
              <div><Label>API Key</Label><Input type="password" value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} placeholder="Chave global da Evolution" /></div>
              <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.server_url || !form.api_key || !form.instance_name || createMutation.isPending} className="w-full">
                {createMutation.isPending ? 'A criar...' : 'Criar e gerar QR'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar...</p>
      ) : instances.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma instância configurada. Adicione a sua primeira instância Evolution API.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {instances.map((inst) => (
            <Card key={inst.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{inst.name}</CardTitle>
                  <StatusBadge status={inst.status} />
                </div>
                {inst.connected_number && (
                  <p className="text-xs text-muted-foreground">📱 {inst.connected_number}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium">Servidor:</span> {inst.server_url}</p>
                  <p><span className="font-medium">Instância:</span> {inst.instance_name}</p>
                  <p className="flex items-center gap-1">
                    <span className="font-medium">API Key:</span>
                    <span className="font-mono">{showKey[inst.id] ? inst.api_key : '••••••••'}</span>
                    <button onClick={() => setShowKey(s => ({ ...s, [inst.id]: !s[inst.id] }))} className="text-muted-foreground hover:text-foreground">
                      {showKey[inst.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </p>
                  {inst.last_connected_at && (
                    <p><span className="font-medium">Última ligação:</span> {new Date(inst.last_connected_at).toLocaleString('pt-PT')}</p>
                  )}
                  <p>
                    <span className="font-medium">Webhook:</span>{' '}
                    {inst.webhook_configured ? '✅ configurado' : '⚠️ não configurado'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {inst.status !== 'online' && (
                    <Button size="sm" variant="default" className="gap-1" onClick={() => reconnect(inst)}>
                      <QrCode className="h-3 w-3" /> Ligar
                    </Button>
                  )}
                  {inst.status === 'online' && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => logoutMutation.mutate(inst.id)}>
                      <LogOut className="h-3 w-3" /> Desligar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => checkStatus(inst)}>
                    <RefreshCw className="h-3 w-3" /> Verificar
                  </Button>
                  {!inst.webhook_configured && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setWebhook(inst)}>
                      Sincronizar eventos
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" className="gap-1" onClick={() => {
                    if (confirm('Remover esta instância?')) deleteMutation.mutate(inst.id);
                  }}>
                    <Trash2 className="h-3 w-3" /> Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QrCodeDialog instance={qrInstance} open={!!qrInstance} onClose={() => setQrInstance(null)} />
    </div>
  );
}
