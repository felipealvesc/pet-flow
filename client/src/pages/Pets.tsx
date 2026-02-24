import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  PawPrint, Plus, Search, Edit2, Trash2, Loader2, Dog, Cat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SIZE_LABELS: Record<string, string> = {
  small: "Pequeno", medium: "Médio", large: "Grande", giant: "Gigante",
};
const SPECIES_LABELS: Record<string, string> = {
  dog: "Cachorro", cat: "Gato", bird: "Pássaro", other: "Outro",
};
const SIZE_COLORS: Record<string, string> = {
  small: "bg-blue-100 text-blue-700",
  medium: "bg-emerald-100 text-emerald-700",
  large: "bg-orange-100 text-orange-700",
  giant: "bg-red-100 text-red-700",
};

function PetAvatar({ species }: { species: string | null }) {
  const emoji = species === "cat" ? "🐱" : species === "bird" ? "🐦" : "🐶";
  return (
    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-lg">
      {emoji}
    </div>
  );
}

export default function Pets() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    clientId: "", name: "", species: "dog", breed: "", size: "medium",
    weight: "", color: "", observations: "", vaccinations: "",
  });

  const utils = trpc.useUtils();
  const { data: pets = [], isLoading } = trpc.pets.list.useQuery(
    { search: search || undefined }, { refetchOnWindowFocus: false }
  );
  const { data: clients = [] } = trpc.clients.list.useQuery(undefined, { refetchOnWindowFocus: false });

  const createMutation = trpc.pets.create.useMutation({
    onSuccess: () => { utils.pets.list.invalidate(); toast.success("Pet cadastrado!"); setIsDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.pets.update.useMutation({
    onSuccess: () => { utils.pets.list.invalidate(); toast.success("Pet atualizado!"); setIsDialogOpen(false); setEditingPet(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.pets.delete.useMutation({
    onSuccess: () => { utils.pets.list.invalidate(); toast.success("Pet removido."); setDeletingId(null); },
  });

  const openCreate = () => {
    setForm({ clientId: "", name: "", species: "dog", breed: "", size: "medium", weight: "", color: "", observations: "", vaccinations: "" });
    setEditingPet(null);
    setIsDialogOpen(true);
  };

  const openEdit = (pet: any) => {
    setEditingPet(pet);
    setForm({
      clientId: String(pet.clientId),
      name: pet.name,
      species: pet.species ?? "dog",
      breed: pet.breed ?? "",
      size: pet.size ?? "medium",
      weight: String(pet.weight ?? ""),
      color: pet.color ?? "",
      observations: pet.observations ?? "",
      vaccinations: pet.vaccinations ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) { toast.error("Nome obrigatório"); return; }
    if (!form.clientId) { toast.error("Selecione o tutor"); return; }
    const payload: any = {
      clientId: parseInt(form.clientId),
      name: form.name,
      species: form.species as any,
      breed: form.breed || undefined,
      size: form.size as any,
      weight: form.weight || undefined,
      color: form.color || undefined,
      observations: form.observations || undefined,
      vaccinations: form.vaccinations || undefined,
    };
    if (editingPet) {
      updateMutation.mutate({ id: editingPet.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getClientName = (clientId: number) => {
    return clients.find(c => c.id === clientId)?.name ?? "—";
  };

  const speciesCount = (s: string) => pets.filter(p => p.species === s).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cadastro de animais dos clientes</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Novo Pet
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: pets.length, emoji: "🐾" },
          { label: "Cachorros", value: speciesCount("dog"), emoji: "🐶" },
          { label: "Gatos", value: speciesCount("cat"), emoji: "🐱" },
          { label: "Outros", value: speciesCount("bird") + speciesCount("other"), emoji: "🦜" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/60 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl">{s.emoji}</span>
              <span className="text-2xl font-bold">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pet por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-card border-border/60"
        />
      </div>

      {/* Pets grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border/60 rounded-xl p-4 animate-pulse">
              <div className="h-10 w-10 bg-muted rounded-xl mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <PawPrint className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum pet encontrado</p>
          <p className="text-sm mt-1">Clique em "Novo Pet" para cadastrar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map(pet => (
            <Card key={pet.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <PetAvatar species={pet.species} />
                    <div>
                      <p className="font-semibold text-sm">{pet.name}</p>
                      <p className="text-xs text-muted-foreground">{SPECIES_LABELS[(pet.species as string) ?? "dog"]}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(pet)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingId(pet.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {pet.size && (
                      <Badge className={`text-xs ${SIZE_COLORS[(pet.size as string)] ?? "bg-gray-100 text-gray-600"}`}>
                        {SIZE_LABELS[(pet.size as string)]}
                      </Badge>
                    )}
                    {pet.breed && <Badge variant="secondary" className="text-xs">{pet.breed}</Badge>}
                    {pet.color && <Badge variant="outline" className="text-xs">{pet.color}</Badge>}
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <p className="text-xs text-muted-foreground">Tutor</p>
                    <p className="text-sm font-medium">{getClientName(pet.clientId)}</p>
                  </div>

                  {pet.observations && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">"{pet.observations}"</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingPet(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              {editingPet ? "Editar Pet" : "Novo Pet"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tutor *</Label>
              <Select value={form.clientId} onValueChange={v => setForm(p => ({ ...p, clientId: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Pet *</Label>
                <Input className="mt-1" placeholder="Ex: Thor" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Espécie</Label>
                <Select value={form.species} onValueChange={v => setForm(p => ({ ...p, species: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">🐶 Cachorro</SelectItem>
                    <SelectItem value="cat">🐱 Gato</SelectItem>
                    <SelectItem value="bird">🐦 Pássaro</SelectItem>
                    <SelectItem value="other">🐾 Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Raça</Label>
                <Input className="mt-1" placeholder="Ex: Golden Retriever" value={form.breed} onChange={e => setForm(p => ({ ...p, breed: e.target.value }))} />
              </div>
              <div>
                <Label>Porte</Label>
                <Select value={form.size} onValueChange={v => setForm(p => ({ ...p, size: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                    <SelectItem value="giant">Gigante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Peso (kg)</Label>
                <Input className="mt-1" type="number" step="0.1" placeholder="0,0" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} />
              </div>
              <div>
                <Label>Cor / Pelagem</Label>
                <Input className="mt-1" placeholder="Ex: Caramelo" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea className="mt-1 resize-none" rows={2} placeholder="Comportamento, alergias, cuidados especiais..." value={form.observations} onChange={e => setForm(p => ({ ...p, observations: e.target.value }))} />
            </div>

            <div>
              <Label>Vacinas</Label>
              <Textarea className="mt-1 resize-none" rows={2} placeholder="Histórico de vacinação..." value={form.vaccinations} onChange={e => setForm(p => ({ ...p, vaccinations: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="gap-2">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingPet ? "Salvar" : "Cadastrar pet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover pet?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
