import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Plus, Search, Edit, Trash2, Star, Calendar, Clock, Tag, Loader2, Settings, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import BlogEditor from '@/components/admin/blog-editor/BlogEditor';
import { useBlogCategories, type BlogCategory } from '@/hooks/useBlogCategories';

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  read_time: string;
  featured: boolean;
  status: string;
  meta_title: string;
  meta_description: string;
  keyword: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState<{ post: BlogPost | null; isNew: boolean } | null>(null);
  const { categories, refetch: refetchCategories } = useBlogCategories();
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<BlogCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar artigos.');
    } else {
      setPosts((data || []) as unknown as BlogPost[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const startNew = () => {
    setEditing({ post: null, isNew: true });
  };

  const startEdit = (post: BlogPost) => {
    setEditing({ post, isNew: false });
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao eliminar.');
      return;
    }
    toast.success('Artigo eliminado.');
    fetchPosts();
  };

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^\w\sà-ú]/gi, '').replace(/\s+/g, '-');

  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    const { error } = await supabase.from('blog_categories').insert({
      name,
      slug: slugify(name),
      sort_order: categories.length + 1,
    } as any);
    if (error) { toast.error('Erro ao criar categoria.'); return; }
    toast.success('Categoria criada!');
    setNewCatName('');
    refetchCategories();
  };

  const updateCategory = async () => {
    if (!editingCat || !editCatName.trim()) return;
    const { error } = await supabase.from('blog_categories').update({
      name: editCatName.trim(),
      slug: slugify(editCatName.trim()),
    } as any).eq('id', editingCat.id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    toast.success('Categoria atualizada!');
    setEditingCat(null);
    refetchCategories();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('blog_categories').delete().eq('id', id);
    if (error) { toast.error('Erro ao eliminar.'); return; }
    toast.success('Categoria eliminada!');
    refetchCategories();
  };

  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // Editor view
  if (editing) {
    return (
      <BlogEditor
        post={editing.post}
        isNew={editing.isNew}
        onBack={() => setEditing(null)}
        onSaved={() => { setEditing(null); fetchPosts(); }}
      />
    );
  }

  // List view
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Blog</h2>
        <div className="flex items-center gap-2">
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Settings className="h-4 w-4" /> Categorias
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gerir Categorias</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Nova categoria..."
                    className="h-9 text-sm"
                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                  />
                  <Button size="sm" onClick={addCategory} disabled={!newCatName.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-secondary/30">
                      {editingCat?.id === cat.id ? (
                        <>
                          <Input
                            value={editCatName}
                            onChange={e => setEditCatName(e.target.value)}
                            className="h-8 text-sm flex-1"
                            onKeyDown={e => e.key === 'Enter' && updateCategory()}
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={updateCategory} className="h-8 px-2 text-primary">
                            Guardar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingCat(null)} className="h-8 px-2">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-foreground">{cat.name}</span>
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setEditingCat(cat); setEditCatName(cat.name); }}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-destructive" onClick={() => deleteCategory(cat.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria criada.</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={startNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Artigo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: posts.length },
          { label: 'Publicados', value: posts.filter(p => p.status === 'published').length },
          { label: 'Rascunhos', value: posts.filter(p => p.status === 'draft').length },
        ].map(s => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar artigos..." className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Tag className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Nenhum artigo encontrado.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <Card key={post.id} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                {post.image && <img src={post.image} alt={post.title} className="w-20 h-14 object-cover rounded-lg shrink-0 hidden sm:block" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground text-sm truncate">{post.title}</h3>
                    {post.featured && <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">{post.category}</Badge>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(post.created_at), "d MMM yyyy", { locale: pt })}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time}</span>
                    <Badge variant={post.status === 'published' ? 'default' : post.status === 'scheduled' ? 'outline' : 'secondary'} className="text-xs">
                      {post.status === 'published' ? 'Publicado' : post.status === 'scheduled' ? '📅 Agendado' : 'Rascunho'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(post)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Eliminar artigo?</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">Tens a certeza que queres eliminar "{post.title}"? Esta ação não pode ser revertida.</p>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm">Cancelar</Button>
                        <Button variant="destructive" size="sm" onClick={() => deletePost(post.id)}>Eliminar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
