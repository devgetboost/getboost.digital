import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle, XCircle, Pencil, EyeOff, Trash2, Search, MessageCircle,
} from 'lucide-react';

type Comment = {
  id: string;
  blog_post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: string;
  created_at: string;
  parent_id: string | null;
  blog_posts?: { title: string } | null;
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  approved: { label: 'Aprovado', variant: 'default' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
  censored: { label: 'Censurado', variant: 'outline' },
};

const AdminComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editComment, setEditComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => { fetchComments(); }, []);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*, blog_posts(title)')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar comentários');
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('blog_comments').update({ status }).eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar');
    } else {
      toast.success(`Comentário ${statusConfig[status]?.label?.toLowerCase() || status}`);
      fetchComments();
    }
  };

  const deleteComment = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este comentário?')) return;
    const { error } = await supabase.from('blog_comments').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao eliminar');
    } else {
      toast.success('Comentário eliminado');
      fetchComments();
    }
  };

  const saveEdit = async () => {
    if (!editComment) return;
    const { error } = await supabase
      .from('blog_comments')
      .update({ content: editContent.trim().slice(0, 2000) })
      .eq('id', editComment.id);
    if (error) {
      toast.error('Erro ao guardar');
    } else {
      toast.success('Comentário editado');
      setEditComment(null);
      fetchComments();
    }
  };

  const filtered = comments.filter((c) => {
    const matchesSearch =
      c.author_name.toLowerCase().includes(search.toLowerCase()) ||
      c.author_email.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = comments.filter((c) => c.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" /> Gestão de Comentários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {comments.length} comentários · {pendingCount > 0 && <span className="text-primary font-medium">{pendingCount} pendente(s)</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, email ou conteúdo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
            <SelectItem value="censored">Censurados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground text-sm">A carregar...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">Nenhum comentário encontrado.</p>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Autor</TableHead>
                <TableHead>Artigo</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{c.author_name}</p>
                    <p className="text-xs text-muted-foreground">{c.author_email}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                    {(c as any).blog_posts?.title || '—'}
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <p className="text-sm truncate">{c.content}</p>
                    {c.parent_id && <p className="text-xs text-primary mt-0.5">↳ Resposta</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[c.status]?.variant || 'secondary'}>
                      {statusConfig[c.status]?.label || c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString('pt-PT')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {c.status !== 'approved' && (
                        <Button size="icon" variant="ghost" onClick={() => updateStatus(c.id, 'approved')} title="Aprovar">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {c.status !== 'rejected' && (
                        <Button size="icon" variant="ghost" onClick={() => updateStatus(c.id, 'rejected')} title="Rejeitar">
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      {c.status !== 'censored' && (
                        <Button size="icon" variant="ghost" onClick={() => updateStatus(c.id, 'censored')} title="Censurar">
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => { setEditComment(c); setEditContent(c.content); }} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteComment(c.id)} title="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editComment} onOpenChange={() => setEditComment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Comentário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong>{editComment?.author_name}</strong> · {editComment?.author_email}
            </p>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={2000}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditComment(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminComments;
