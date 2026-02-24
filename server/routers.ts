import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";
import {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct, getLowStockProducts,
  getClients, getClientById, createClient, updateClient, deleteClient, getInactiveClients,
  getPetsByClient, getPetById, getAllPets, createPet, updatePet, deletePet,
  getAppointments, getAppointmentById, getAppointmentByToken, createAppointment, updateAppointment, deleteAppointment, getClientAppointments,
  getTransactions, createTransaction, getDashboardMetrics,
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Products ────────────────────────────────────────────────────────────
  products: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), category: z.string().optional() }).optional())
      .query(({ input }) => getProducts(input?.search, input?.category)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getProductById(input.id)),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        sku: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        price: z.string(),
        costPrice: z.string().optional(),
        stock: z.number().optional(),
        minStock: z.number().optional(),
        unit: z.string().optional(),
        tags: z.string().optional(),
        imageUrl: z.string().optional(),
        active: z.boolean().optional(),
        aiGenerated: z.boolean().optional(),
      }))
      .mutation(({ input }) => createProduct(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        sku: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        price: z.string().optional(),
        costPrice: z.string().optional(),
        stock: z.number().optional(),
        minStock: z.number().optional(),
        unit: z.string().optional(),
        tags: z.string().optional(),
        imageUrl: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateProduct(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteProduct(input.id)),

    lowStock: protectedProcedure.query(() => getLowStockProducts()),

    generateAI: protectedProcedure
      .input(z.object({ productName: z.string(), category: z.string().optional(), brand: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { productName, category, brand } = input;

        // Generate SKU
        const categoryCode = (category ?? "PET").substring(0, 3).toUpperCase();
        const nameCode = productName.replace(/\s+/g, "").substring(0, 4).toUpperCase();
        const randomCode = nanoid(4).toUpperCase();
        const sku = `${categoryCode}-${nameCode}-${randomCode}`;

        // Generate comprehensive product info via LLM
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em produtos para pet shops. Analise o nome do produto e gere informações completas otimizadas para venda. Considere o mercado brasileiro de pets. Responda em JSON com informações realistas e úteis.`,
            },
            {
              role: "user",
              content: `Analise este produto para pet shop: "${productName}". ${category ? `Categoria sugerida: ${category}.` : ''} ${brand ? `Marca: ${brand}.` : ''}

Retorne JSON com:
- description: descrição persuasiva (máximo 200 caracteres)
- tags: array de até 5 tags relevantes
- category: categoria mais apropriada (Alimentação, Higiene, Acessórios, Medicamentos, Brinquedos, Camas e Casinhas, Coleiras e Guias, Outros)
- suggestedPrice: preço sugerido em reais (número, considere mercado brasileiro)
- unit: unidade de venda (un, kg, g, ml, l, pacote, caixa, etc.)
- targetAnimals: animais-alvo (cachorro, gato, pássaro, outros ou combinação)

Seja específico e realista baseado no nome do produto.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "product_complete_info",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  description: { type: "string", maxLength: 200 },
                  tags: { type: "array", items: { type: "string" }, maxItems: 5 },
                  category: { type: "string", enum: ["Alimentação", "Higiene", "Acessórios", "Medicamentos", "Brinquedos", "Camas e Casinhas", "Coleiras e Guias", "Outros"] },
                  suggestedPrice: { type: "number", minimum: 1, maximum: 1000 },
                  unit: { type: "string", maxLength: 20 },
                  targetAnimals: { type: "string" },
                },
                required: ["description", "tags", "category", "suggestedPrice", "unit", "targetAnimals"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

        return {
          sku,
          description: parsed.description ?? "",
          tags: (parsed.tags ?? []).join(", "),
          category: parsed.category ?? category ?? "",
          suggestedPrice: parsed.suggestedPrice ?? 0,
          unit: parsed.unit ?? "un",
          targetAnimals: parsed.targetAnimals ?? "",
        };
      }),
  }),

  // ─── Clients ─────────────────────────────────────────────────────────────
  clients: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(({ input }) => getClients(input?.search)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getClientById(input.id)),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        cpf: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input }) => createClient(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        cpf: z.string().optional(),
        notes: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateClient(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteClient(input.id)),

    inactive: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(({ input }) => getInactiveClients(input.days)),

    appointments: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(({ input }) => getClientAppointments(input.clientId)),
  }),

  // ─── Pets ─────────────────────────────────────────────────────────────────
  pets: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(({ input }) => getAllPets(input?.search)),

    byClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(({ input }) => getPetsByClient(input.clientId)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getPetById(input.id)),

    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string().min(1),
        species: z.enum(["dog", "cat", "bird", "other"]).optional(),
        breed: z.string().optional(),
        size: z.enum(["small", "medium", "large", "giant"]).optional(),
        weight: z.string().optional(),
        birthDate: z.date().optional(),
        color: z.string().optional(),
        observations: z.string().optional(),
        vaccinations: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(({ input }) => createPet(input as any)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        species: z.enum(["dog", "cat", "bird", "other"]).optional(),
        breed: z.string().optional(),
        size: z.enum(["small", "medium", "large", "giant"]).optional(),
        weight: z.string().optional(),
        birthDate: z.date().optional(),
        color: z.string().optional(),
        observations: z.string().optional(),
        vaccinations: z.string().optional(),
        imageUrl: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updatePet(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deletePet(input.id)),
  }),

  // ─── Grooming ─────────────────────────────────────────────────────────────
  grooming: router({
    list: protectedProcedure
      .input(z.object({ from: z.date().optional(), to: z.date().optional() }).optional())
      .query(({ input }) => getAppointments(input?.from, input?.to)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getAppointmentById(input.id)),

    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const appt = await getAppointmentByToken(input.token);
        if (!appt) return null;
        // Fetch pet and client info
        const [pet, client] = await Promise.all([
          getPetById(appt.petId),
          import("./db").then(m => m.getClientById(appt.clientId)),
        ]);
        return { ...appt, pet, client };
      }),

    create: protectedProcedure
      .input(z.object({
        petId: z.number(),
        clientId: z.number(),
        service: z.enum(["bath", "grooming", "bath_grooming", "nail", "ear", "full"]),
        scheduledAt: z.date(),
        price: z.string().optional(),
        notes: z.string().optional(),
        groomer: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const token = nanoid(32);
        return createAppointment({ ...input, checkInToken: token });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        service: z.enum(["bath", "grooming", "bath_grooming", "nail", "ear", "full"]).optional(),
        status: z.enum(["scheduled", "arrived", "bathing", "grooming", "ready", "completed", "cancelled"]).optional(),
        scheduledAt: z.date().optional(),
        completedAt: z.date().optional(),
        price: z.string().optional(),
        notes: z.string().optional(),
        groomer: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateAppointment(id, data as any);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["scheduled", "arrived", "bathing", "grooming", "ready", "completed", "cancelled"]),
      }))
      .mutation(({ input }) => updateAppointment(input.id, { status: input.status })),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteAppointment(input.id)),
  }),

  // ─── Dashboard ────────────────────────────────────────────────────────────
  dashboard: router({
    metrics: protectedProcedure.query(() => getDashboardMetrics()),
    transactions: protectedProcedure
      .input(z.object({ from: z.date().optional(), to: z.date().optional() }).optional())
      .query(({ input }) => getTransactions(input?.from, input?.to)),
    createTransaction: protectedProcedure
      .input(z.object({
        type: z.enum(["income", "expense"]),
        category: z.string().optional(),
        description: z.string().optional(),
        amount: z.string(),
        date: z.date(),
        clientId: z.number().optional(),
      }))
      .mutation(({ input }) => createTransaction(input as any)),
  }),

  // ─── Marketing ────────────────────────────────────────────────────────────
  marketing: router({
    campaigns: protectedProcedure.query(() => getCampaigns()),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        message: z.string().min(1),
        discountPercent: z.number().optional(),
        targetDaysInactive: z.number().optional(),
        status: z.enum(["draft", "active", "paused", "completed"]).optional(),
      }))
      .mutation(({ input }) => createCampaign(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        message: z.string().optional(),
        discountPercent: z.number().optional(),
        targetDaysInactive: z.number().optional(),
        status: z.enum(["draft", "active", "paused", "completed"]).optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateCampaign(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteCampaign(input.id)),

    inactiveClients: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(({ input }) => getInactiveClients(input.days)),

    generateMessage: protectedProcedure
      .input(z.object({ petName: z.string(), discountPercent: z.number(), daysInactive: z.number() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um especialista em marketing para pet shops. Crie mensagens de WhatsApp amigáveis, curtas e persuasivas para recuperar clientes inativos. Use emojis com moderação.",
            },
            {
              role: "user",
              content: `Crie uma mensagem de WhatsApp para recuperar um cliente cujo pet se chama "${input.petName}", que não vem há ${input.daysInactive} dias, oferecendo ${input.discountPercent}% de desconto no próximo banho/tosa.`,
            },
          ],
        });
        return { message: response.choices[0]?.message?.content ?? "" };
      }),
  }),
});

export type AppRouter = typeof appRouter;
