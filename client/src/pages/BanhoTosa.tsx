import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Scissors,
  Plus,
  CalendarDays,
  Clock,
  User,
  PawPrint,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  Link2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const STATUS_CONFIG = {
  scheduled: { label: "Agendado", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  arrived: { label: "Chegou", color: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  bathing: { label: "Em Banho", color: "bg-cyan-100 text-cyan-700 border-cyan-200", dot: "bg-cyan-500" },
  grooming: { label: "Em Tosa", color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  ready: { label: "Pronto!", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  completed: { label: "Concluído", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-600 border-red-200", dot: "bg-red-400" },
};

const STATUS_FLOW = ["scheduled", "arrived", "bathing", "grooming", "ready", "completed"] as const;

const SERVICE_LABELS: Record<string, string> = {
  bath: "Banho",
  grooming: "Tosa",
  bath_grooming: "Banho + Tosa",
  nail: "Corte de Unhas",
  ear: "Limpeza de Ouvido",
  full: "Pacote Completo",
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.scheduled;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getWeekDays(baseDate: Date) {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function BanhoTosa() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [newAppt, setNewAppt] = useState({
    petId: "", clientId: "", service: "bath_grooming", scheduledAt: "", price: "", notes: "", groomer: "",
  });

  const weekDays = useMemo(() => getWeekDays(currentWeek), [currentWeek]);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const utils = trpc.useUtils();

  const { data: appointments = [], isLoading } = trpc.grooming.list.useQuery(
    { from: weekStart, to: weekEnd },
    { refetchOnWindowFocus: false }
  );

  const { data: clients = [] } = trpc.clients.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const { data: pets = [] } = trpc.pets.list.useQuery(undefined, { refetchOnWindowFocus: false });

  const createMutation = trpc.grooming.create.useMutation({
    onSuccess: (data) => {
      utils.grooming.list.invalidate();
      toast.success("Agendamento criado!");
      setIsDialogOpen(false);
      if (data?.checkInToken) setShareToken(data.checkInToken);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatusMutation = trpc.grooming.updateStatus.useMutation({
    onSuccess: () => {
      utils.grooming.list.invalidate();
      toast.success("Status atualizado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.grooming.delete.useMutation({
    onSuccess: () => {
      utils.grooming.list.invalidate();
      toast.success("Agendamento removido.");
      setSelectedAppt(null);
    },
  });

  const handleCreate = () => {
    if (!newAppt.petId || !newAppt.clientId || !newAppt.scheduledAt) {
      toast.error("Preencha pet, cliente e data/hora");
      return;
    }
    createMutation.mutate({
      petId: parseInt(newAppt.petId),
      clientId: parseInt(newAppt.clientId),
      service: newAppt.service as any,
      scheduledAt: new Date(newAppt.scheduledAt),
      price: newAppt.price || undefined,
      notes: newAppt.notes || undefined,
      groomer: newAppt.groomer || undefined,
    });
  };

  const advanceStatus = (appt: any) => {
    const idx = STATUS_FLOW.indexOf(appt.status as any);
    if (idx < STATUS_FLOW.length - 1) {
      updateStatusMutation.mutate({ id: appt.id, status: STATUS_FLOW[idx + 1] });
    }
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/acompanhar/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const getApptsByDay = (day: Date) => {
    return appointments.filter(a => {
      const d = new Date(a.scheduledAt);
      return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
    });
  };

  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  const weekLabel = `${weekDays[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — ${weekDays[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;

  const todayAppts = getApptsByDay(today);
  const pendingCount = appointments.filter(a => !["completed", "cancelled"].includes(a.status ?? "")).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banho & Tosa</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Agenda semanal de serviços</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Hoje", value: todayAppts.length, color: "bg-blue-100 text-blue-600" },
          { label: "Esta semana", value: appointments.length, color: "bg-primary/10 text-primary" },
          { label: "Pendentes", value: pendingCount, color: "bg-orange-100 text-orange-600" },
          { label: "Prontos hoje", value: todayAppts.filter(a => a.status === "ready").length, color: "bg-emerald-100 text-emerald-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border/60 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() - 7); setCurrentWeek(d); }}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{weekLabel}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() + 7); setCurrentWeek(d); }}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekly grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dayAppts = getApptsByDay(day);
          const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
          return (
            <div
              key={day.toISOString()}
              className={`rounded-xl border min-h-[120px] p-2 ${isToday(day) ? "border-primary bg-primary/5" : "border-border/60 bg-card"}`}
            >
              <div className={`text-center mb-2 ${isToday(day) ? "text-primary" : "text-muted-foreground"}`}>
                <p className="text-[10px] font-semibold uppercase">{dayNames[day.getDay()]}</p>
                <p className={`text-lg font-bold leading-none ${isToday(day) ? "text-primary" : "text-foreground"}`}>
                  {day.getDate()}
                </p>
              </div>
              <div className="space-y-1">
                {dayAppts.map(appt => {
                  const config = STATUS_CONFIG[(appt.status as string) as keyof typeof STATUS_CONFIG];
                  return (
                    <button
                      key={appt.id}
                      onClick={() => setSelectedAppt(appt)}
                      className={`w-full text-left p-1.5 rounded-lg border text-[10px] font-medium transition-all hover:opacity-80 ${config?.color ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 shrink-0" />
                        <span>{formatTime(appt.scheduledAt)}</span>
                      </div>
                      <p className="truncate mt-0.5">{SERVICE_LABELS[(appt.service as string)] ?? appt.service}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's list */}
      {todayAppts.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Atendimentos de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppts.map(appt => (
              <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:bg-muted/20 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Scissors className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{SERVICE_LABELS[(appt.service as string)]}</p>
                    <StatusBadge status={appt.status ?? "scheduled"} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTime(appt.scheduledAt)} {appt.groomer ? `• ${appt.groomer}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {appt.checkInToken && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyShareLink(appt.checkInToken!)}>
                      <Link2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {!["completed", "cancelled"].includes(appt.status ?? "") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1"
                      onClick={() => advanceStatus(appt)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Check className="h-3 w-3" />
                      Avançar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Share link toast */}
      {shareToken && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Link2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-800">Link de acompanhamento gerado!</p>
              <p className="text-xs text-emerald-600 truncate">{window.location.origin}/acompanhar/{shareToken}</p>
            </div>
            <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 shrink-0" onClick={() => copyShareLink(shareToken)}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setShareToken(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Appointment detail dialog */}
      {selectedAppt && (
        <Dialog open={!!selectedAppt} onOpenChange={(open) => !open && setSelectedAppt(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-primary" />
                Detalhes do Agendamento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={selectedAppt.status} />
                <span className="text-sm text-muted-foreground">{formatDate(selectedAppt.scheduledAt)} às {formatTime(selectedAppt.scheduledAt)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Serviço</p>
                  <p className="font-medium">{SERVICE_LABELS[selectedAppt.service]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-medium">{selectedAppt.price ? `R$ ${selectedAppt.price}` : "—"}</p>
                </div>
                {selectedAppt.groomer && (
                  <div>
                    <p className="text-xs text-muted-foreground">Tosador</p>
                    <p className="font-medium">{selectedAppt.groomer}</p>
                  </div>
                )}
                {selectedAppt.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Observações</p>
                    <p className="font-medium">{selectedAppt.notes}</p>
                  </div>
                )}
              </div>

              {/* Status flow */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Progresso</p>
                <div className="flex items-center gap-1">
                  {STATUS_FLOW.map((s, i) => {
                    const currentIdx = STATUS_FLOW.indexOf(selectedAppt.status as any);
                    const isDone = i <= currentIdx;
                    const config = STATUS_CONFIG[s];
                    return (
                      <div key={s} className="flex items-center gap-1 flex-1">
                        <div className={`h-2 w-full rounded-full transition-all ${isDone ? "bg-primary" : "bg-muted"}`} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">Agendado</span>
                  <span className="text-[10px] text-muted-foreground">Concluído</span>
                </div>
              </div>

              {selectedAppt.checkInToken && (
                <Button variant="outline" className="w-full gap-2" onClick={() => selectedAppt.checkInToken && copyShareLink(selectedAppt.checkInToken)}>
                  <Link2 className="h-4 w-4" />
                  Copiar link para tutor
                </Button>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate({ id: selectedAppt.id })}
                disabled={deleteMutation.isPending}
              >
                Cancelar agendamento
              </Button>
              {!["completed", "cancelled"].includes(selectedAppt.status) && (
                <Button
                  size="sm"
                  onClick={() => { advanceStatus(selectedAppt); setSelectedAppt(null); }}
                  disabled={updateStatusMutation.isPending}
                  className="gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  Avançar status
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente *</Label>
                <Select value={newAppt.clientId} onValueChange={v => setNewAppt(p => ({ ...p, clientId: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pet *</Label>
                <Select value={newAppt.petId} onValueChange={v => setNewAppt(p => ({ ...p, petId: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Serviço</Label>
              <Select value={newAppt.service} onValueChange={v => setNewAppt(p => ({ ...p, service: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data e Hora *</Label>
                <Input
                  type="datetime-local"
                  className="mt-1"
                  value={newAppt.scheduledAt}
                  onChange={e => setNewAppt(p => ({ ...p, scheduledAt: e.target.value }))}
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="mt-1"
                  value={newAppt.price}
                  onChange={e => setNewAppt(p => ({ ...p, price: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Tosador/Banhista</Label>
              <Input
                placeholder="Nome do profissional"
                className="mt-1"
                value={newAppt.groomer}
                onChange={e => setNewAppt(p => ({ ...p, groomer: e.target.value }))}
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações sobre o pet ou serviço..."
                className="mt-1 resize-none"
                rows={2}
                value={newAppt.notes}
                onChange={e => setNewAppt(p => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="gap-2">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
