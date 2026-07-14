import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useBrevoLists, useCreateList, useDeleteList, useBrevoListContacts } from "@/hooks/useBrevo";
import { Plus, Trash2, Users, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function AdminEmailLists() {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [viewListId, setViewListId] = useState<number | null>(null);
  const [viewListName, setViewListName] = useState("");

  const { data, isLoading, error } = useBrevoLists(50, 0);
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const { data: listContacts, isLoading: loadingContacts } = useBrevoListContacts(viewListId);

  const lists = data?.lists || [];

  const handleCreate = async () => {
    if (!newName) return;
    try {
      await createList.mutateAsync({ name: newName });
      toast.success("Lista criada");
      setShowCreate(false);
      setNewName("");
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar lista");
    }
  };

  const handleDelete = async (listId: number, name: string) => {
    if (!confirm(`Eliminar a lista "${name}"?`)) return;
    try {
      await deleteList.mutateAsync(listId);
      toast.success("Lista eliminada");
    } catch (e: any) {
      toast.error(e.message || "Erro ao eliminar lista");
    }
  };

  if (error?.message === "BREVO_NOT_CONFIGURED") {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Configura a chave API do Brevo para gerir listas.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{lists.length} lista(s)</p>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Nova Lista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Lista</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Lista *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Newsletter Geral" />
              </div>
              <Button onClick={handleCreate} disabled={!newName || createList.isPending} className="w-full">
                {createList.isPending ? "A criar..." : "Criar Lista"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contactos</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : lists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhuma lista encontrada
                  </TableCell>
                </TableRow>
              ) : (
                lists.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {l.totalSubscribers || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{l.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setViewListId(l.id); setViewListName(l.name); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(l.id, l.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* List contacts sheet */}
      <Sheet open={!!viewListId} onOpenChange={(open) => { if (!open) setViewListId(null); }}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Contactos — {viewListName}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {loadingContacts ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : listContacts?.contacts?.length > 0 ? (
              listContacts.contacts.map((c: any) => (
                <div key={c.email} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                  <div>
                    <p className="font-medium">{c.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {[c.attributes?.FIRSTNAME, c.attributes?.LASTNAME].filter(Boolean).join(" ") || "—"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum contacto nesta lista</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
