import { z } from "zod";

// Schema validação com valores padrão seguros
const ProductInfoSchema = z.object({
  nomeProduto: z.string().min(1, "Nome do produto obrigatório"),
  sku: z.string().min(1, "SKU obrigatório").toUpperCase(),
  categoria: z.string().min(1, "Categoria obrigatória"),
  marca: z.string().min(1, "Marca obrigatória"),
  descricao: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  precoSugerido: z.number().positive().nullable().optional(),
  custoEstimado: z.number().positive().nullable().optional(),
  estoqueMinimoSugerido: z.number().min(1, "Estoque mínimo deve ser no mínimo 1").default(5),
  unidade: z.string().default("Unidade"),
  tags: z.array(z.string()).min(1, "Deve ter no mínimo uma tag").default([]),
});

export type ProductInfo = z.infer<typeof ProductInfoSchema>;

// Valores padrão seguros
const DEFAULT_PRODUCT_INFO: ProductInfo = {
  nomeProduto: "Produto sem nome",
  sku: "SKU-DEFAULT",
  categoria: "Outros",
  marca: "Genérica",
  descricao: "Sem descrição disponível",
  precoSugerido: null,
  custoEstimado: null,
  estoqueMinimoSugerido: 5,
  unidade: "Unidade",
  tags: ["produto"],
};

/**
 * Limpa e formata uma string para ser segura
 */
function sanitizeString(value: unknown): string {
  if (typeof value === "string") {
    return value
      .trim()
      .slice(0, 500) // Limita tamanho
      .replace(/[\x00-\x1F\x7F]/g, ""); // Remove caracteres de controle
  }
  return "";
}

/**
 * Converte valor para número de forma segura
 */
function toSafeNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return num;
}

/**
 * Valida e formata resposta do assistente OpenAI
 * Mesmo que chegue JSON inválido, retorna um objeto seguro
 */
export function validateProductInfo(data: unknown): ProductInfo {
  // Se não for objeto, retorna padrão
  if (!data || typeof data !== "object") {
    console.warn("[ProductInfo] Invalid data format, using defaults");
    return DEFAULT_PRODUCT_INFO;
  }

  const obj = data as Record<string, unknown>;

  try {
    // Extrai valores com sanitização
    const sanitized = {
      nomeProduto: sanitizeString(obj.nomeProduto || obj.productName || obj.nome),
      sku: sanitizeString(obj.sku || "").toUpperCase() || "SKU-AUTO",
      categoria: sanitizeString(obj.categoria || obj.category || "Outros"),
      marca: sanitizeString(obj.marca || obj.brand || "Genérica"),
      descricao: sanitizeString(obj.descricao || obj.description || ""),
      precoSugerido: toSafeNumber(obj.precoSugerido || obj.suggestedPrice),
      custoEstimado: toSafeNumber(obj.custoEstimado || obj.costPrice),
      estoqueMinimoSugerido: Math.max(1, toSafeNumber(obj.estoqueMinimoSugerido || obj.minStock || 5) || 5),
      unidade: sanitizeString(obj.unidade || obj.unit) || "Unidade",
      tags: Array.isArray(obj.tags) 
        ? obj.tags
            .map(t => sanitizeString(t))
            .filter(t => t.length > 0)
            .slice(0, 10) // Máximo 10 tags
        : [],
    };

    // Validações obrigatórias
    if (!sanitized.nomeProduto) sanitized.nomeProduto = DEFAULT_PRODUCT_INFO.nomeProduto;
    if (!sanitized.descricao || sanitized.descricao.length < 10) {
      sanitized.descricao = `${sanitized.nomeProduto} - Descrição não disponível`;
    }
    if (sanitized.tags.length === 0) {
      sanitized.tags = sanitized.nomeProduto.split(" ").slice(0, 5);
    }

    // Parse e validação com Zod
    const validated = ProductInfoSchema.parse(sanitized);
    return validated;
  } catch (error) {
    console.error("[ProductInfo] Validation error:", error);
    console.info("[ProductInfo] Using defaults for invalid data");
    return DEFAULT_PRODUCT_INFO;
  }
}

/**
 * Tenta fazer parse de JSON com tratamento de erro
 */
export function safeParseJSON(text: string): unknown {
  try {
    // Remove caracteres inválidos
    const cleaned = text
      .replace(/[\x00-\x1F\x7F]/g, "") // Remove caracteres de controle
      .trim();

    if (!cleaned) return null;

    // Tenta fazer parse
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("[JSON Parse] Error:", error);
    
    // Tenta extrair objeto JSON do meio de um texto
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        console.error("[JSON Parse] Could not extract valid JSON");
        return null;
      }
    }

    return null;
  }
}
