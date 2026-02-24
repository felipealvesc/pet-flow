import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useForm } from "react-hook-form";
// @ts-ignore
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  Tag,
  BarChart2,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const CATEGORIES = [
  "Alimentação", "Higiene", "Acessórios", "Medicamentos",
  "Brinquedos", "Camas e Casinhas", "Coleiras e Guias", "Outros",
];

const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  sku: z.string().min(1, "SKU obrigatório"),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  price: z.string().min(1, "Preço obrigatório"),
  costPrice: z.string().optional(),
  stock: z.union([z.number(), z.string()]).optional().transform(val => val === "" ? 0 : Number(val)),
  minStock: z.union([z.number(), z.string()]).optional().transform(val => val === "" ? 5 : Number(val)),
  unit: z.string().optional(),
  tags: z.string().optional(),
  active: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function StockBadge({ stock, minStock }: { stock: number | null; minStock: number | null }) {
  const s = stock ?? 0;
  const m = minStock ?? 5;
  if (s === 0) return <Badge variant="destructive" className="text-xs">Sem estoque</Badge>;
  if (s <= m) return <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">Estoque baixo</Badge>;
  return <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">Em estoque</Badge>;
}

export default function Produtos() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const utils = trpc.useUtils();

  const { data: products = [], isLoading } = trpc.products.list.useQuery(
    { search: search || undefined, category: category || undefined },
    { refetchOnWindowFocus: false }
  );

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produto criado com sucesso!");
      setIsDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produto atualizado!");
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produto excluído.");
      setDeletingId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const generateAI = trpc.products.generateAI.useMutation();

  const form = useForm<ProductFormValues, any, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "", sku: "", description: "", category: "", brand: "",
      price: "", costPrice: "", stock: 0, minStock: 5, unit: "un", tags: "", active: true,
    },
  });

  const openCreate = () => {
    form.reset({ name: "", sku: "", description: "", category: "", brand: "", price: "", costPrice: "", stock: 0, minStock: 5, unit: "un", tags: "", active: true });
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      sku: product.sku,
      description: product.description ?? "",
      category: product.category ?? "",
      brand: product.brand ?? "",
      price: String(product.price),
      costPrice: String(product.costPrice ?? ""),
      stock: product.stock ?? 0,
      minStock: product.minStock ?? 5,
      unit: product.unit ?? "un",
      tags: product.tags ?? "",
      active: product.active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleGenerateAI = async () => {
    const name = form.getValues("name");
    if (!name) {
      toast.error("Informe o nome do produto primeiro");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const result = await generateAI.mutateAsync({
        productName: name,
      });

      // Preenchr todos os campos com dados do assistente
      form.setValue("sku", result.sku);
      form.setValue("description", result.descricao);
      form.setValue("category", result.categoria);
      form.setValue("brand", result.marca);
      form.setValue("tags", result.tags.join(", "));
      form.setValue("unit", result.unidade);
      
      // Campos opcionais
      if (result.precoSugerido) {
        form.setValue("price", result.precoSugerido.toString());
      }
      if (result.custoEstimado) {
        form.setValue("costPrice", result.custoEstimado.toString());
      }
      if (result.estoqueMinimoSugerido) {
        form.setValue("minStock", result.estoqueMinimoSugerido);
      }

      toast.success("Informações do produto geradas pela IA com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar dados com IA:", error);
      toast.error("Erro ao gerar dados com IA. Tente novamente.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const onSubmit = (values: ProductFormValues) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...values });
    } else {
      createMutation.mutate(values as any);
    }
  };

  const lowStockCount = products.filter(p => (p.stock ?? 0) <= (p.minStock ?? 5)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie seu catálogo de produtos
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{products.length}</p>
          </div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-lg font-bold">{products.filter(p => p.active).length}</p>
          </div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estoque Baixo</p>
            <p className="text-lg font-bold">{lowStockCount}</p>
          </div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Com IA</p>
            <p className="text-lg font-bold">{products.filter(p => p.aiGenerated).length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/60"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48 bg-card border-border/60">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Products table */}
      <Card className="border-border/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">PRODUTO</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">SKU</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">CATEGORIA</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">PREÇO</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">ESTOQUE</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">STATUS</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Nenhum produto encontrado</p>
                    <p className="text-sm mt-1">Clique em "Novo Produto" para adicionar</p>
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate max-w-[160px]">{product.name}</p>
                          {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                          {product.aiGenerated && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 gap-0.5 mt-0.5 border-purple-200 text-purple-600">
                              <Sparkles className="h-2.5 w-2.5" /> IA
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{product.sku}</code>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {product.category ? (
                        <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-sm">{formatCurrency(product.price)}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`text-sm font-medium ${(product.stock ?? 0) <= (product.minStock ?? 5) ? "text-orange-600" : "text-foreground"}`}>
                        {product.stock ?? 0} {product.unit ?? "un"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StockBadge stock={product.stock ?? null} minStock={product.minStock ?? null} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingId(product.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingProduct(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* AI Generation button */}
              {!editingProduct && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-purple-800">Geração por IA</p>
                    <p className="text-xs text-purple-600">Informe o nome e clique para gerar SKU e descrição automaticamente</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="border-purple-200 text-purple-700 hover:bg-purple-100 shrink-0"
                  >
                    {isGeneratingAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {isGeneratingAI ? "Gerando..." : "Gerar com IA"}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto *</FormLabel>
                    <FormControl><Input placeholder="Ex: Ração Premium Adulto" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU *</FormLabel>
                    <FormControl><Input placeholder="Ex: ALI-RACA-X1Y2" {...field} className="font-mono" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl><Input placeholder="Ex: Royal Canin" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição do produto..." rows={3} {...field} className="resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Separator />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Venda *</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="costPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="minStock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Mín.</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="un">Unidade (un)</SelectItem>
                        <SelectItem value="kg">Quilograma (kg)</SelectItem>
                        <SelectItem value="g">Grama (g)</SelectItem>
                        <SelectItem value="l">Litro (l)</SelectItem>
                        <SelectItem value="ml">Mililitro (ml)</SelectItem>
                        <SelectItem value="cx">Caixa (cx)</SelectItem>
                        <SelectItem value="pct">Pacote (pct)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tags" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl><Input placeholder="Ex: cão, adulto, premium" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingProduct ? "Salvar alterações" : "Criar produto"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será removido permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
