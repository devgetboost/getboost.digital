import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type Row = {
  id: string;
  slug: string;
  title: string;
  notify_email: string;
  cc_emails: string[];
  brevo_list_id: number | null;
  crm_pipeline: string | null;
  crm_stage: string | null;
  owner_name: string | null;
  active: boolean;
  notes: string | null;
};

const empty = (): Row => ({
  id: '',
  slug: '',
  title: '',
  notify_email: 'nunocruz@getboost.digital',
  cc_emails: [],
  brevo_list_id: null,
  crm_pipeline: null,
  crm_stage: null,
  owner_name: null,
  active: true,
  notes: null,
});

export default function AdminSolucaoRouting() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('solucao_routing')
      .select('*')
      .order('title', { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (idx: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const save = async (row: Row) => {
    setSavingId(row.id || row.slug);
    const payload = {
      slug: row.slug.trim(),
      title: row.title.trim(),
      notify_email: row.notify_email.trim(),
      cc_emails: row.cc_emails.map((e) => e.trim()).filter(Boolean),
      brevo_list_id: row.brevo_list_id,
      crm_pipeline: row.crm_pipeline?.trim() || null,
      crm_stage: row.crm_stage?.trim() || null,
      owner_name: row.owner_name?.trim() || null,
      active: row.active,
      notes: row.notes?.trim() || null,
    };
    const q = row.id
      ? supabase.from('solucao_routing').update(payload).eq('id', row.id)
      : supabase.from('solucao_routing').insert(payload);
    const { error } = await q;
    setSavingId(null);
    if (error) toast.error(error.message);
    else { toast.success('Guardado'); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este mapeamento?')) return;
    const { error } = await supabase.from('solucao_routing').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Removido'); load(); }
  };

  const addRow = () => setRows((prev) => [empty(), ...prev]);

  const filtered = rows.filter((r) =>
    !filter ||
    r.slug.toLowerCase().includes(filter.toLowerCase()) ||
    r.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Routing por Solução</h1>
          <p className="text-sm text-muted-foreground">
            Configura o email de notificação, CCs, lista Brevo e pipeline do CRM para cada página /solucoes/&lt;slug&gt;.
          </p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Filtrar por slug ou título" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-64" />
          <Button onClick={addRow} variant="outline"><Plus className="h-4 w-4 mr-1" /> Novo</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.map((row, i) => {
            const idx = rows.indexOf(row);
            return (
              <div key={row.id || `new-${i}`} className="border rounded-lg p-4 bg-card space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Slug</Label>
                    <Input value={row.slug} onChange={(e) => update(idx, { slug: e.target.value })} placeholder="landing-pages" />
                  </div>
                  <div>
                    <Label>Título</Label>
                    <Input value={row.title} onChange={(e) => update(idx, { title: e.target.value })} placeholder="Landing Pages" />
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={row.active} onCheckedChange={(v) => update(idx, { active: v })} />
                      <span className="text-sm">{row.active ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Notificar (email principal)</Label>
                    <Input value={row.notify_email} onChange={(e) => update(idx, { notify_email: e.target.value })} placeholder="responsavel@getboost.digital" />
                  </div>
                  <div>
                    <Label>Em cópia (CC, separados por vírgula)</Label>
                    <Input
                      value={row.cc_emails.join(', ')}
                      onChange={(e) => update(idx, { cc_emails: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
                      placeholder="comercial@getboost.digital, ops@getboost.digital"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label>Brevo — List ID</Label>
                    <Input
                      type="number"
                      value={row.brevo_list_id ?? ''}
                      onChange={(e) => update(idx, { brevo_list_id: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Ex: 12"
                    />
                  </div>
                  <div>
                    <Label>CRM — Pipeline</Label>
                    <Input value={row.crm_pipeline ?? ''} onChange={(e) => update(idx, { crm_pipeline: e.target.value })} placeholder="Marketing" />
                  </div>
                  <div>
                    <Label>CRM — Etapa</Label>
                    <Input value={row.crm_stage ?? ''} onChange={(e) => update(idx, { crm_stage: e.target.value })} placeholder="Novo lead" />
                  </div>
                  <div>
                    <Label>Responsável</Label>
                    <Input value={row.owner_name ?? ''} onChange={(e) => update(idx, { owner_name: e.target.value })} placeholder="Nuno Cruz" />
                  </div>
                </div>

                <div>
                  <Label>Notas internas</Label>
                  <Textarea rows={2} value={row.notes ?? ''} onChange={(e) => update(idx, { notes: e.target.value })} />
                </div>

                <div className="flex justify-end gap-2">
                  {row.id && (
                    <Button variant="ghost" size="sm" onClick={() => remove(row.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  )}
                  <Button size="sm" onClick={() => save(row)} disabled={savingId === (row.id || row.slug)}>
                    {savingId === (row.id || row.slug) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Guardar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
