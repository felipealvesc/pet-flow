import { trpc } from "@/lib/trpc";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Package,
  Scissors,
  TrendingUp,
  Users,
  AlertTriangle,
  PawPrint,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = "primary",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  color?: "primary" | "green" | "blue" | "orange" | "red";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    green: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1 truncate">{value}</p>
            {trendLabel && (
              <div className="flex items-center gap-1 mt-2">
                {trend === "up" && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />}
                {trend === "down" && <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                <span className={`text-xs font-medium ${
                  trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"
                }`}>
                  {trendLabel}
                </span>
              </div>
            )}
            {subtitle && !trendLabel && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ml-4 ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data: metrics, isLoading } = trpc.dashboard.metrics.useQuery();

  const incomeGrowth = metrics
    ? metrics.lastMonthIncome > 0
      ? (((metrics.monthIncome - metrics.lastMonthIncome) / metrics.lastMonthIncome) * 100).toFixed(1)
      : null
    : null;

  const isGrowthPositive = incomeGrowth !== null && parseFloat(incomeGrowth) >= 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão geral do seu pet shop
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Atualizado agora
        </Badge>
      </div>

      {/* Metric cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Receita do Mês"
            value={formatCurrency(metrics?.monthIncome ?? 0)}
            icon={TrendingUp}
            trend={isGrowthPositive ? "up" : "down"}
            trendLabel={
              incomeGrowth !== null
                ? `${isGrowthPositive ? "+" : ""}${incomeGrowth}% vs mês anterior`
                : "Sem dados anteriores"
            }
            color="primary"
          />
          <MetricCard
            title="Clientes Ativos"
            value={String(metrics?.totalClients ?? 0)}
            icon={Users}
            subtitle="Clientes cadastrados"
            color="blue"
          />
          <MetricCard
            title="Agendamentos"
            value={String(metrics?.monthAppointments ?? 0)}
            icon={CalendarDays}
            subtitle="Neste mês"
            color="green"
          />
          <MetricCard
            title="Estoque Baixo"
            value={String(metrics?.lowStockCount ?? 0)}
            icon={AlertTriangle}
            subtitle="Produtos abaixo do mínimo"
            color={metrics?.lowStockCount && metrics.lowStockCount > 0 ? "red" : "orange"}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Receita vs Despesas</CardTitle>
            <CardDescription className="text-xs">Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={metrics?.monthlyRevenue ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.52 0.18 175)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="oklch(0.52 0.18 175)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.62 0.18 30)" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="oklch(0.62 0.18 30)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 220)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.55 0.02 240)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.02 240)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                  <Area type="monotone" dataKey="income" name="Receita" stroke="oklch(0.52 0.18 175)" strokeWidth={2} fill="url(#incomeGrad)" dot={{ r: 3, fill: "oklch(0.52 0.18 175)" }} />
                  <Area type="monotone" dataKey="expense" name="Despesas" stroke="oklch(0.62 0.18 30)" strokeWidth={2} fill="url(#expenseGrad)" dot={{ r: 3, fill: "oklch(0.62 0.18 30)" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Resumo Rápido</CardTitle>
            <CardDescription className="text-xs">Métricas do período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700 font-medium">Receita Total</p>
                    <p className="text-sm font-bold text-emerald-800">{formatCurrency(metrics?.monthIncome ?? 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="h-9 w-9 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 font-medium">Total Clientes</p>
                    <p className="text-sm font-bold text-blue-800">{metrics?.totalClients ?? 0} clientes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="h-9 w-9 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
                    <Scissors className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-700 font-medium">Agendamentos</p>
                    <p className="text-sm font-bold text-purple-800">{metrics?.monthAppointments ?? 0} este mês</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-orange-700 font-medium">Produtos Ativos</p>
                    <p className="text-sm font-bold text-orange-800">{metrics?.totalProducts ?? 0} produtos</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly bar chart */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Receita Mensal</CardTitle>
          <CardDescription className="text-xs">Comparativo dos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics?.monthlyRevenue ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 220)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.55 0.02 240)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.02 240)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Receita" fill="oklch(0.52 0.18 175)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
