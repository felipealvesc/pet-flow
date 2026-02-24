import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users, Plus, Search, Edit2, Trash2, Phone, Mail, PawPrint,
  ChevronRight, Loader2, History, X, Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const SERVICE_LABELS: Record<string, string> = {
  bath: "Banho", grooming: "Tosa", bath_grooming: "Banho + Tosa",
  nail: "Unhas", ear: "Ouvido", full: "Completo",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  arrived: "bg-yellow-100 text-yellow-700",
  bathing: "bg-cyan-100 text-cyan-700",
  grooming: "bg-purple-100 text-purple-700",
  ready: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingClient, setViewingClient] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", cpf: "", notes: "" });

  const utils = trpc.useUtils();
  const { data: clients = [], isLoading } = trpc.clients.list.useQuery(
    { search: search || undefined }, { refetchOnWindowFocus: false }
  );
  const { data: clientHistory = [] } = trpc.clients.appointments.useQuery(
    { clientId: viewingClient?.id ?? 0 },
    { enabled: !!viewingClient, refetchOnWindowFocus: false }
  );
  const { data: clientPets = [] } = trpc.pets.byClient.useQuery(
    { clientId: viewingClient?.id ?? 0 },
    { enabled: !!viewingClient, refetchOnWindowFocus: false }
  );

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); toast.success("Cliente criado!"); setIsDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); toast.success("Cliente atualizado!"); setIsDialogOpen(false); setEditingClient(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); toast.success("Cliente removido."); setDeletingId(null); },
  });

  const openCreate = () => {
    setForm({ name: "", phone: "", email: "", address: "", cpf: "", notes: "" });
    setEditingClient(null);
    setIsDialogOpen(true);
  };

  const openEdit = (client: any) => {
    setEditingClient(client);
    setForm({ name: client.name, phone: client.phone ?? "", email: client.email ?? "", address: client.address ?? "", cpf: client.cpf ?? "", notes: client.notes ?? "" });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) { toast.error("Nome obrigatório"); return; }
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const daysSinceVisit = (lastVisit: Date | null) => {
    if (!lastVisit) return null;
    const diff = Date.now() - new Date(lastVisit).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua base de clientes</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold mt-1">{clients.length}</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Ativos</p>
          <p className="text-2xl font-bold mt-1">{clients.filter(c => c.active).length}</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Inativos +30d</p>
          <p className="text-2xl font-bold mt-1 text-orange-600">
            {clients.filter(c => { const d = daysSinceVisit(c.lastVisit); return d === null || d > 30; }).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-card border-border/60"
        />
      </div>

      {/* Clients list */}
      <Card className="border-border/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">CLIENTE</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">CONTATO</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">ÚLTIMA VISITA</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">STATUS</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nenhum cliente encontrado</p>
                  </td>
                </tr>
              ) : (
                clients.map(client => {
                  const days = daysSinceVisit(client.lastVisit);
                  return (
                    <tr key={client.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-semibold text-primary text-sm">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{client.name}</p>
                            {client.cpf && <p className="text-xs text-muted-foreground">{client.cpf}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="space-y-0.5">
                          {client.phone && <p className="text-xs flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{client.phone}</p>}
                          {client.email && <p className="text-xs flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{client.email}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div>
                          <p className="text-sm">{formatDate(client.lastVisit)}</p>
                          {days !== null && (
                            <p className={`text-xs ${days > 30 ? "text-orange-600" : "text-muted-foreground"}`}>
                              {days === 0 ? "Hoje" : `${days} dias atrás`}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        {days !== null && days > 30 ? (
                          <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">Inativo</Badge>
                        ) : (
                          <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">Ativo</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingClient(client)}>
                            <History className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingId(client.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Client history dialog */}
      {viewingClient && (
        <Dialog open={!!viewingClient} onOpenChange={(open) => !open && setViewingClient(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                  {viewingClient.name.charAt(0).toUpperCase()}
                </div>
                {viewingClient.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Client info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {viewingClient.phone && <div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{viewingClient.phone}</p></div>}
                {viewingClient.email && <div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{viewingClient.email}</p></div>}
                {viewingClient.cpf && <div><p className="text-xs text-muted-foreground">CPF</p><p className="font-medium">{viewingClient.cpf}</p></div>}
                <div><p className="text-xs text-muted-foreground">Cadastro</p><p className="font-medium">{formatDate(viewingClient.createdAt)}</p></div>
              </div>

              {/* Pets */}
              {clientPets.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><PawPrint className="h-4 w-4 text-primary" /> Pets</p>
                    <div className="flex flex-wrap gap-2">
                      {clientPets.map(pet => (
                        <Badge key={pet.id} variant="secondary" className="gap-1">
                          <PawPrint className="h-3 w-3" /> {pet.name}
                          {pet.breed && <span className="text-muted-foreground">· {pet.breed}</span>}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* History */}
              <Separator />
              <div>
                <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"><History className="h-4 w-4 text-primary" /> Histórico de Serviços</p>
                {clientHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum serviço registrado</p>
                ) : (
                  <div className="space-y-2">
                    {clientHistory.map(appt => (
                      <div key={appt.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Scissors className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{SERVICE_LABELS[(appt.service as string)] ?? appt.service}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(appt.scheduledAt)}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[(appt.status as string) ?? "scheduled"] ?? "bg-gray-100 text-gray-600"}`}>
                          {appt.status}
                        </span>
                        {appt.price && <span className="text-sm font-medium shrink-0">R$ {appt.price}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingClient(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input className="mt-1" placeholder="Nome completo" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone / WhatsApp</Label>
                <Input className="mt-1" placeholder="(11) 99999-9999" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <Label>CPF</Label>
                <Input className="mt-1" placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>E-mail</Label>
              <Input className="mt-1" type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input className="mt-1" placeholder="Rua, número, bairro" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea className="mt-1 resize-none" rows={2} placeholder="Observações sobre o cliente..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="gap-2">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingClient ? "Salvar" : "Criar cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


