import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface Instance { id: string; name: string; }
interface Agent { id: string; name: string; function_slug: string | null; }
interface Mapping {
  id: string;
  instance_id: string;
  agent_id: string;
  notes: string | null;
}

export default function WhatsAppInstanceAgentMap() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form for new row
  const [newInstanceId, setNewInstanceId] = useState<string>('');
  const [newAgentId, setNewAgentId] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  async function loadAll() {
    setLoading(true);
    const [i, a, m] = await Promise.all([
      supabase.from('whatsapp_instances').select('id, name').order('name'),
      supabase.from('agentic_agents').select('id, name, function_slug').order('name'),
      supabase.from('whatsapp_instance_agent_map').select('*'),
    ]);
    setInstances((i.data as Instance[]) || []);
    setAgents((a.data as Agent[]) || []);
    setMappings((m.data as Mapping[]) || []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  const mappedIds = useMemo(() => new Set(mappings.map(m => m.instance_id)), [mappings]);
  const availableInstances = instances.filter(i => !mappedIds.has(i.id));
  const instanceName = (id: string) => instances.find(i => i.id === id)?.name || '—';
  const agentName = (id: string) => agents.find(a => a.id === id)?.name || '—';

  async function addMapping() {
    if (!newInstanceId || !newAgentId) {
      toast.error('Escolhe uma instância e um agente');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('whatsapp_instance_agent_map').insert({
      instance_id: newInstanceId,
      agent_id: newAgentId,
      notes: newNotes.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Mapeamento criado');
    setNewInstanceId(''); setNewAgentId(''); setNewNotes('');
    loadAll();
  }

  async function updateMapping(m: Mapping, patch: Partial<Mapping>) {
    const { error } = await supabase.from('whatsapp_instance_agent_map')
      .update(patch).eq('id', m.id);
    if (error) { toast.error(error.message); return; }
    setMappings(prev => prev.map(x => x.id === m.id ? { ...x, ...patch } : x));
  }

  async function removeMapping(m: Mapping) {
    if (!confirm(`Remover mapeamento de "${instanceName(m.instance_id)}"?`)) return;
    const { error } = await supabase.from('whatsapp_instance_agent_map').delete().eq('id', m.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Mapeamento removido');
    setMappings(prev => prev.filter(x => x.id !== m.id));
  }

  return (
    <div className="space-y-6 mt-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" /> Agente por Instância
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cada instância de WhatsApp (Getboost PT, Getboost BR, Qook…) usa o seu próprio agente de IA,
          com persona, idioma e base de conhecimento próprios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo mapeamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
            <div>
              <Label className="text-xs">Instância WhatsApp</Label>
              <Select value={newInstanceId} onValueChange={setNewInstanceId}>
                <SelectTrigger><SelectValue placeholder="Escolhe…" /></SelectTrigger>
                <SelectContent>
                  {availableInstances.length === 0 && (
                    <SelectItem value="none" disabled>Todas as instâncias já mapeadas</SelectItem>
                  )}
                  {availableInstances.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Agente</Label>
              <Select value={newAgentId} onValueChange={setNewAgentId}>
                <SelectTrigger><SelectValue placeholder="Escolhe…" /></SelectTrigger>
                <SelectContent>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}{a.function_slug ? ` · ${a.function_slug}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notas (opcional)</Label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ex: pt-PT, tom formal"
              />
            </div>
            <Button onClick={addMapping} disabled={saving} className="gap-1.5">
              <Save className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground text-center">A carregar…</p>
          ) : mappings.length === 0 ? (
            <p className="p-12 text-sm text-muted-foreground text-center">
              Ainda não existem mapeamentos. Adiciona o primeiro acima.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instância</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Badge variant="outline">{instanceName(m.instance_id)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={m.agent_id}
                        onValueChange={(v) => updateMapping(m, { agent_id: v })}
                      >
                        <SelectTrigger className="h-8 w-full max-w-xs">
                          <SelectValue>{agentName(m.agent_id)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}{a.function_slug ? ` · ${a.function_slug}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={m.notes || ''}
                        onBlur={(e) => {
                          const v = e.target.value.trim() || null;
                          if (v !== (m.notes || null)) updateMapping(m, { notes: v });
                        }}
                        placeholder="—"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => removeMapping(m)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Nota: a função <code>whatsapp-assistant-reply</code> deve ler esta tabela por{' '}
        <code>conversation.instance_id</code> para escolher o agente correcto.
      </p>
    </div>
  );
}
