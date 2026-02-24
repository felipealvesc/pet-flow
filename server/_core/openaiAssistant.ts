import axios from "axios";
import { ENV } from "./env";
import { safeParseJSON, validateProductInfo, type ProductInfo } from "./productValidator";

const OPENAI_API_URL = "https://api.openai.com/v1";
const TIMEOUT = 30000; // 30 segundos

interface OpenAIMessage {
  role: "user" | "assistant";
  content: string;
}

interface OpenAIThread {
  id: string;
  object: string;
  created_at: number;
}

interface OpenAIRun {
  id: string;
  object: string;
  status: string;
}

interface OpenAIRunStep {
  id: string;
  object: string;
  status: string;
  type: string;
  run_id: string;
}

/**
 * Integração com OpenAI Assistants API
 * Usa um assistente pré-configurado para extrair informações de produtos
 */
export class OpenAIAssistantService {
  private apiKey: string;
  private assistantId: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = ENV.forgeApiKey;
    this.assistantId = ENV.openaiAssistantId;
    this.apiUrl = OPENAI_API_URL;

    if (!this.apiKey) {
      throw new Error("BUILT_IN_FORGE_API_KEY não configurada");
    }
    if (!this.assistantId) {
      throw new Error("OPENAI_ASSISTANT_ID não configurada");
    }
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "OpenAI-Beta": "assistants=v2",
    };
  }

  private async makeRequest<T>(
    method: "GET" | "POST",
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    try {
      const response = await axios({
        method,
        url: `${this.apiUrl}${endpoint}`,
        data,
        headers: this.getHeaders(),
        timeout: TIMEOUT,
      });
      return response.data as T;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `OpenAI API error: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Cria uma conversa (thread) com o assistente
   */
  async createThread(): Promise<string> {
    const thread = await this.makeRequest<OpenAIThread>("POST", "/threads");
    return thread.id;
  }

  /**
   * Envia mensagem para o thread
   */
  async addMessage(threadId: string, message: string): Promise<void> {
    await this.makeRequest("POST", `/threads/${threadId}/messages`, {
      role: "user",
      content: message,
    });
  }

  /**
   * Executa o assistente
   */
  async runAssistant(threadId: string): Promise<string> {
    const run = await this.makeRequest<OpenAIRun>("POST", `/threads/${threadId}/runs`, {
      assistant_id: this.assistantId,
    });
    return run.id;
  }

  /**
   * Aguarda conclusão da execução
   */
  async waitForCompletion(threadId: string, runId: string): Promise<void> {
    const maxAttempts = 60; // 60 tentativas x 500ms = 30 segundos
    let attempts = 0;

    while (attempts < maxAttempts) {
      const run = await this.makeRequest<OpenAIRun>("GET", `/threads/${threadId}/runs/${runId}`);

      if (run.status === "completed") {
        return;
      }

      if (run.status === "failed" || run.status === "cancelled") {
        throw new Error(`Assistant run ${run.status}`);
      }

      // Se expirou durante execução
      if (run.status === "expired") {
        throw new Error("Assistant request expired");
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    throw new Error("Timeout waiting for assistant response");
  }

  /**
   * Recupera mensagens do thread
   */
  async getMessages(threadId: string): Promise<OpenAIMessage[]> {
    const response = await this.makeRequest<{ data: Array<{ content: Array<{ type: string; text?: { value: string } }> }> }>(
      "GET",
      `/threads/${threadId}/messages?limit=10`
    );

    return response.data
      .filter(msg => msg.content?.[0]?.type === "text")
      .map(msg => ({
        role: "assistant" as const,
        content: msg.content?.[0]?.text?.value || "",
      }));
  }

  /**
   * Extrai informações do produto usando o assistente
   */
  async extractProductInfo(productName: string): Promise<ProductInfo> {
    try {
      console.log(`[OpenAI] Starting product info extraction for: ${productName}`);

      // 1. Criar thread
      const threadId = await this.createThread();
      console.log(`[OpenAI] Created thread: ${threadId}`);

      // 2. Enviar mensagem
      const prompt = `Analise o seguinte nome de produto e extraia as informações completas em JSON:

Produto: "${productName}"

Retorne EXATAMENTE neste formato JSON (sem markdown, sem comentários):
{
  "nomeProduto": "nome completo do produto",
  "sku": "código único em MAIÚSCULAS",
  "categoria": "categoria apropriada",
  "marca": "marca do produto",
  "descricao": "descrição detalhada com no mínimo 50 caracteres",
  "precoSugerido": null,
  "custoEstimado": null,
  "estoqueMinimoSugerido": 5,
  "unidade": "Unidade",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

      await this.addMessage(threadId, prompt);
      console.log(`[OpenAI] Message added to thread`);

      // 3. Executar assistente
      const runId = await this.runAssistant(threadId);
      console.log(`[OpenAI] Assistant running: ${runId}`);

      // 4. Aguardar conclusão
      await this.waitForCompletion(threadId, runId);
      console.log(`[OpenAI] Assistant completed`);

      // 5. Recuperar mensagens
      const messages = await this.getMessages(threadId);
      console.log(`[OpenAI] Retrieved ${messages.length} messages`);

      if (messages.length === 0) {
        throw new Error("No response from assistant");
      }

      // 6. Parse e validação
      const lastMessage = messages[0].content;
      console.log(`[OpenAI] Raw response: ${lastMessage}`);

      const parsed = safeParseJSON(lastMessage);
      const validated = validateProductInfo(parsed);

      console.log(`[OpenAI] Successfully extracted product info`);
      return validated;
    } catch (error) {
      console.error(`[OpenAI] Error extracting product info:`, error);
      
      // Retorna dados padrão em caso de erro
      const { validateProductInfo: validate } = await import("./productValidator");
      return validate({
        nomeProduto: productName,
        sku: "SKU-AUTO",
        categoria: "Produtos",
        marca: "Genérica",
        descricao: `${productName} - Informações extraídas com limitações`,
        estoqueMinimoSugerido: 5,
        unidade: "Unidade",
        tags: productName.split(" ").slice(0, 5),
      });
    }
  }
}

// Singleton
let assistantService: OpenAIAssistantService | null = null;

export function getAssistantService(): OpenAIAssistantService {
  if (!assistantService) {
    assistantService = new OpenAIAssistantService();
  }
  return assistantService;
}
