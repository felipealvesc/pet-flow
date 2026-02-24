import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Megaphone, Plus, Sparkles, Users, Clock, Play, Pause,
  Trash2, Edit2, Loader2, MessageSquare, Send, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Slider } from "@/components/ui/slider";

const STATUS_CONFIG = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-600 border-gray-200" },
  active: { label: "Ativa", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  paused: { label: "Pausada", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  completed: { label: "Concluída", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function Marketing() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [inactiveDays, setInactiveDays] = useState(30);
  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);
  const [form, setForm] = useState({
    name: "", message: "", discountPercent: 10, targetDaysInactive: 30,
  });

  const utils = trpc.useUtils();
  const { data: campaigns = [], isLoading } = trpc.marketing.campaigns.useQuery();
  const { data: inactiveClients = [] } = trpc.marketing.inactiveClients.useQuery(
    { days: inactiveDays }, { refetchOnWindowFocus: false }
  );

  const createMutation = trpc.marketing.create.useMutation({
    onSuccess: () => { utils.marketing.campaigns.invalidate(); toast.success("Campanha criada!"); setIsDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.marketing.update.useMutation({
    onSuccess: () => { utils.marketing.campaigns.invalidate(); toast.success("Campanha atualizada!"); setIsDialogOpen(false); setEditingCampaign(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.marketing.delete.useMutation({
    onSuccess: () => { utils.marketing.campaigns.invalidate(); toast.success("Campanha removida."); setDeletingId(null); },
  });
  const generateMsgMutation = trpc.marketing.generateMessage.useMutation();

  const openCreate = () => {
    setForm({ name: "", message: "", discountPercent: 10, targetDaysInactive: 30 });
    setEditingCampaign(null);
    setIsDialogOpen(true);
  };

  const openEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setForm({
      name: campaign.name,
      message: campaign.message,
      discountPercent: campaign.discountPercent ?? 10,
      targetDaysInactive: campaign.targetDaysInactive ?? 30,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.message) { toast.error("Nome e mensagem são obrigatórios"); return; }
    if (editingCampaign) {
      updateMutation.mutate({ id: editingCampaign.id, ...form });
    } else {
      createMutation.mutate({ ...form, status: "draft" });
    }
  };

  const handleGenerateMessage = async () => {
    setIsGeneratingMsg(true);
    try {
      const result = await generateMsgMutation.mutateAsync({
        petName: "seu pet",
        discountPercent: form.discountPercent,
        daysInactive: form.targetDaysInactive,
      });
      setForm(p => ({ ...p, message: typeof result.message === 'string' ? result.message : String(result.message) }));
      toast.success("Mensagem gerada pela IA!");
    } catch {
      toast.error("Erro ao gerar mensagem");
    } finally {
      setIsGeneratingMsg(false);
    }
  };

  const toggleStatus = (campaign: any) => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    updateMutation.mutate({ id: campaign.id, status: newStatus });
  };

  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sentCount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Recuperação automática de clientes</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Campanhas</p>
          <p className="text-2xl font-bold mt-1">{campaigns.length}</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Ativas</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{activeCampaigns}</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Msgs Enviadas</p>
          <p className="text-2xl font-bold mt-1">{totalSent}</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Inativos ({inactiveDays}d)</p>
          <p className="text-2xl font-bold mt-1 text-orange-600">{inactiveClients.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaigns list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold">Campanhas</h2>
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border/60 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border/60 rounded-xl">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma campanha criada</p>
              <p className="text-sm mt-1">Crie sua primeira campanha de recuperação</p>
            </div>
          ) : (
            campaigns.map(campaign => {
              const config = STATUS_CONFIG[(campaign.status as keyof typeof STATUS_CONFIG)] ?? STATUS_CONFIG.draft;
              return (
                <Card key={campaign.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{campaign.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{campaign.message}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Alvo: clientes inativos há {campaign.targetDaysInactive}+ dias
                          </span>
                          {(campaign.discountPercent ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              🏷️ {campaign.discountPercent}% de desconto
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            {campaign.sentCount ?? 0} enviados
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleStatus(campaign)}
                          disabled={updateMutation.isPending}
                        >
                          {campaign.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(campaign)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingId(campaign.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Inactive clients panel */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold mb-1">Clientes Inativos</h2>
            <p className="text-xs text-muted-foreground">Sem visita nos últimos {inactiveDays} dias</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Período: {inactiveDays} dias</Label>
            </div>
            <Slider
              value={[inactiveDays]}
              onValueChange={([v]) => setInactiveDays(v)}
              min={7}
              max={180}
              step={7}
              className="mb-4"
            />
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0">
              {inactiveClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-medium">Todos ativos!</p>
                  <p className="text-xs mt-1">Nenhum cliente inativo neste período</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {inactiveClients.slice(0, 8).map(client => {
                    const days = client.lastVisit
                      ? Math.floor((Date.now() - new Date(client.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    return (
                      <div key={client.id} className="flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 font-semibold text-orange-700 text-xs">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {days !== null ? `${days} dias sem visita` : "Nunca visitou"}
                          </p>
                        </div>
                        {client.phone && (
                          <a
                            href={`https://wa.me/55${client.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 transition-colors shrink-0"
                            title="Enviar WhatsApp"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                  {inactiveClients.length > 8 && (
                    <div className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">+{inactiveClients.length - 8} clientes inativos</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingCampaign(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {editingCampaign ? "Editar Campanha" : "Nova Campanha"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Campanha *</Label>
              <Input className="mt-1" placeholder="Ex: Recuperação de clientes inativos" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Desconto (%)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.discountPercent}
                    onChange={e => setForm(p => ({ ...p, discountPercent: parseInt(e.target.value) || 0 }))}
                  />
                  <span className="text-sm text-muted-foreground shrink-0">%</span>
                </div>
              </div>
              <div>
                <Label>Dias inativo</Label>
                <Input
                  type="number"
                  min={1}
                  className="mt-1"
                  value={form.targetDaysInactive}
                  onChange={e => setForm(p => ({ ...p, targetDaysInactive: parseInt(e.target.value) || 30 }))}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Mensagem *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateMessage}
                  disabled={isGeneratingMsg}
                  className="gap-1.5 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  {isGeneratingMsg ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Gerar com IA
                </Button>
              </div>
              <Textarea
                className="resize-none"
                rows={5}
                placeholder="Oi! Sentimos sua falta 🐾 Que tal agendar um banho para o seu pet? Temos um desconto especial para você!"
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use variáveis: {"{nome_cliente}"}, {"{nome_pet}"}, {"{desconto}"}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="gap-2">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingCampaign ? "Salvar" : "Criar campanha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
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
