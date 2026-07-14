import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useBrevoContacts, useCreateContact, useDeleteContact } from "@/hooks/useBrevo";
import { Plus, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminEmailContacts() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const limit = 20;

  const { data, isLoading, error } = useBrevoContacts(limit, offset);
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();

  const contacts = data?.contacts || [];
  const totalCount = data?.count || 0;

  const filteredContacts = search
    ? contacts.filter((c: any) =>
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.attributes?.FIRSTNAME?.toLowerCase().includes(search.toLowerCase()) ||
        c.attributes?.LASTNAME?.toLowerCase().includes(search.toLowerCase())
      )
    : contacts;

  const handleCreate = async () => {
    if (!newEmail) return;
    try {
      await createContact.mutateAsync({
        email: newEmail,
        attributes: { FIRSTNAME: newFirstName, LASTNAME: newLastName },
      });
      toast.success("Contacto criado com sucesso");
      setShowAdd(false);
      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar contacto");
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Remover o contacto ${email}?`)) return;
    try {
      await deleteContact.mutateAsync(email);
      toast.success("Contacto removido");
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover contacto");
    }
  };

  if (error?.message === "BREVO_NOT_CONFIGURED") {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Configura a chave API do Brevo para gerir contactos.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar contactos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Contacto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email *</Label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="Nome" />
                </div>
                <div>
                  <Label>Apelido</Label>
                  <Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Apelido" />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!newEmail || createContact.isPending} className="w-full">
                {createContact.isPending ? "A criar..." : "Criar Contacto"}
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
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Apelido</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum contacto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((c: any) => (
                  <TableRow key={c.id || c.email}>
                    <TableCell className="font-medium">{c.email}</TableCell>
                    <TableCell>{c.attributes?.FIRSTNAME || "—"}</TableCell>
                    <TableCell>{c.attributes?.LASTNAME || "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.email)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalCount} contacto(s) no total</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Pág. {Math.floor(offset / limit) + 1}</span>
          <Button
            variant="outline"
            size="icon"
            disabled={offset + limit >= totalCount}
            onClick={() => setOffset(offset + limit)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
