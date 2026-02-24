import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module to avoid real DB calls
vi.mock("./db", () => ({
  getProducts: vi.fn().mockResolvedValue([]),
  getProductById: vi.fn().mockResolvedValue(undefined),
  createProduct: vi.fn().mockResolvedValue({ id: 1, name: "Test", sku: "TST-001", price: "10.00", active: true }),
  updateProduct: vi.fn().mockResolvedValue({ id: 1, name: "Updated", sku: "TST-001", price: "15.00" }),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
  getLowStockProducts: vi.fn().mockResolvedValue([]),
  getClients: vi.fn().mockResolvedValue([]),
  getClientById: vi.fn().mockResolvedValue(undefined),
  createClient: vi.fn().mockResolvedValue({ id: 1, name: "Maria Silva", phone: "11999999999" }),
  updateClient: vi.fn().mockResolvedValue({ id: 1, name: "Maria Silva Atualizada" }),
  deleteClient: vi.fn().mockResolvedValue(undefined),
  getInactiveClients: vi.fn().mockResolvedValue([]),
  getClientAppointments: vi.fn().mockResolvedValue([]),
  getPetsByClient: vi.fn().mockResolvedValue([]),
  getPetById: vi.fn().mockResolvedValue(undefined),
  getAllPets: vi.fn().mockResolvedValue([]),
  createPet: vi.fn().mockResolvedValue({ id: 1, name: "Thor", species: "dog", clientId: 1 }),
  updatePet: vi.fn().mockResolvedValue({ id: 1, name: "Thor Updated" }),
  deletePet: vi.fn().mockResolvedValue(undefined),
  getAppointments: vi.fn().mockResolvedValue([]),
  getAppointmentById: vi.fn().mockResolvedValue(undefined),
  getAppointmentByToken: vi.fn().mockResolvedValue(undefined),
  createAppointment: vi.fn().mockResolvedValue({ id: 1, petId: 1, clientId: 1, service: "bath", status: "scheduled", scheduledAt: new Date(), checkInToken: "abc123" }),
  updateAppointment: vi.fn().mockResolvedValue({ id: 1, status: "arrived" }),
  deleteAppointment: vi.fn().mockResolvedValue(undefined),
  getTransactions: vi.fn().mockResolvedValue([]),
  createTransaction: vi.fn().mockResolvedValue(undefined),
  getDashboardMetrics: vi.fn().mockResolvedValue({
    monthIncome: 1500.0,
    lastMonthIncome: 1200.0,
    totalClients: 25,
    totalProducts: 48,
    monthAppointments: 32,
    lowStockCount: 3,
    monthlyRevenue: [],
  }),
  getCampaigns: vi.fn().mockResolvedValue([]),
  createCampaign: vi.fn().mockResolvedValue({ id: 1, name: "Campanha Teste", message: "Olá!", status: "draft" }),
  updateCampaign: vi.fn().mockResolvedValue({ id: 1, status: "active" }),
  deleteCampaign: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ description: "Produto premium para pets", tags: ["pet", "premium"] }) } }],
  }),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@petflow.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("PetFlow CRM — Products Router", () => {
  it("lists products", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.products.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a product", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.products.create({
      name: "Ração Premium",
      sku: "ALI-RACA-001",
      price: "89.90",
    });
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test");
  });

  it("generates AI product data", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.products.generateAI({
      productName: "Ração Premium para Cães",
      category: "Alimentação",
    });
    expect(result.sku).toMatch(/^ALI-/);
    expect(result.description).toBeTruthy();
    expect(result.tags).toBeTruthy();
  });
});

describe("PetFlow CRM — Clients Router", () => {
  it("lists clients", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.clients.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a client", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.clients.create({
      name: "Maria Silva",
      phone: "11999999999",
      email: "maria@example.com",
    });
    expect(result).toBeDefined();
    expect(result?.name).toBe("Maria Silva");
  });

  it("lists inactive clients", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.clients.inactive({ days: 30 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("PetFlow CRM — Pets Router", () => {
  it("lists all pets", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.pets.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a pet", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.pets.create({
      clientId: 1,
      name: "Thor",
      species: "dog",
      breed: "Golden Retriever",
      size: "large",
    });
    expect(result).toBeDefined();
    expect(result?.name).toBe("Thor");
  });
});

describe("PetFlow CRM — Grooming Router", () => {
  it("lists appointments", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.grooming.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates an appointment with check-in token", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.grooming.create({
      petId: 1,
      clientId: 1,
      service: "bath_grooming",
      scheduledAt: new Date(),
      price: "80.00",
    });
    expect(result).toBeDefined();
    expect(result?.checkInToken).toBeTruthy();
  });

  it("updates appointment status", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.grooming.updateStatus({ id: 1, status: "arrived" });
    expect(result).toBeDefined();
  });
});

describe("PetFlow CRM — Dashboard Router", () => {
  it("returns dashboard metrics", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.dashboard.metrics();
    expect(result).toBeDefined();
    expect(result?.monthIncome).toBe(1500.0);
    expect(result?.totalClients).toBe(25);
    expect(result?.monthAppointments).toBe(32);
  });
});

describe("PetFlow CRM — Marketing Router", () => {
  it("lists campaigns", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.marketing.campaigns();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a campaign", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.marketing.create({
      name: "Recuperação de Clientes",
      message: "Sentimos sua falta! Venha com desconto.",
      discountPercent: 15,
      targetDaysInactive: 30,
      status: "draft",
    });
    expect(result).toBeDefined();
    expect(result?.name).toBe("Campanha Teste");
  });

  it("generates marketing message via AI", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.marketing.generateMessage({
      petName: "Thor",
      discountPercent: 20,
      daysInactive: 45,
    });
    expect(result.message).toBeTruthy();
  });
});
