import { and, desc, eq, gte, like, lt, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import {
  clients,
  groomingAppointments,
  InsertClient,
  InsertGroomingAppointment,
  InsertMarketingCampaign,
  InsertPet,
  InsertProduct,
  InsertTransaction,
  InsertUser,
  marketingCampaigns,
  pets,
  products,
  transactions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    try {
      const sqlite = new Database("./drizzle/db.sqlite");
      _db = drizzle(sqlite);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(search?: string, category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (search) conditions.push(or(like(products.name, `%${search}%`), like(products.sku, `%${search}%`)));
  if (category) conditions.push(eq(products.category, category));
  return db.select().from(products).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(products.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(products).values(data);
  const result = await db.select().from(products).where(eq(products.sku, data.sku)).limit(1);
  return result[0];
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(products).set(data).where(eq(products.id, id));
  return getProductById(id);
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(products).where(eq(products.id, id));
}

export async function getLowStockProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(sql`${products.stock} <= ${products.minStock}`);
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export async function getClients(search?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = search
    ? [or(like(clients.name, `%${search}%`), like(clients.phone, `%${search}%`), like(clients.email, `%${search}%`))]
    : [];
  return db.select().from(clients).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(clients).values(data);
  const inserted = await db.select().from(clients).where(eq(clients.id, (result as any).insertId)).limit(1);
  return inserted[0];
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
  return getClientById(id);
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(clients).where(eq(clients.id, id));
}

export async function getInactiveClients(daysInactive: number) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysInactive);
  return db.select().from(clients).where(
    or(lt(clients.lastVisit, cutoff), sql`${clients.lastVisit} IS NULL`)
  );
}

// ─── Pets ─────────────────────────────────────────────────────────────────────
export async function getPetsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pets).where(eq(pets.clientId, clientId));
}

export async function getPetById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pets).where(eq(pets.id, id)).limit(1);
  return result[0];
}

export async function getAllPets(search?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = search ? [like(pets.name, `%${search}%`)] : [];
  return db.select().from(pets).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(pets.createdAt));
}

export async function createPet(data: InsertPet) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(pets).values(data);
  const inserted = await db.select().from(pets).where(eq(pets.id, (result as any).insertId)).limit(1);
  return inserted[0];
}

export async function updatePet(id: number, data: Partial<InsertPet>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(pets).set(data).where(eq(pets.id, id));
  return getPetById(id);
}

export async function deletePet(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(pets).where(eq(pets.id, id));
}

// ─── Grooming Appointments ────────────────────────────────────────────────────
export async function getAppointments(from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (from) conditions.push(gte(groomingAppointments.scheduledAt, from));
  if (to) conditions.push(lte(groomingAppointments.scheduledAt, to));
  return db.select().from(groomingAppointments)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(groomingAppointments.scheduledAt);
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(groomingAppointments).where(eq(groomingAppointments.id, id)).limit(1);
  return result[0];
}

export async function getAppointmentByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(groomingAppointments).where(eq(groomingAppointments.checkInToken, token)).limit(1);
  return result[0];
}

export async function createAppointment(data: InsertGroomingAppointment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(groomingAppointments).values(data);
  const inserted = await db.select().from(groomingAppointments).where(eq(groomingAppointments.id, (result as any).insertId)).limit(1);
  // Update client lastVisit
  await db.update(clients).set({ lastVisit: new Date() }).where(eq(clients.id, data.clientId));
  return inserted[0];
}

export async function updateAppointment(id: number, data: Partial<InsertGroomingAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(groomingAppointments).set(data).where(eq(groomingAppointments.id, id));
  return getAppointmentById(id);
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(groomingAppointments).where(eq(groomingAppointments.id, id));
}

export async function getClientAppointments(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(groomingAppointments)
    .where(eq(groomingAppointments.clientId, clientId))
    .orderBy(desc(groomingAppointments.scheduledAt));
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export async function getTransactions(from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (from) conditions.push(gte(transactions.date, from));
  if (to) conditions.push(lte(transactions.date, to));
  return db.select().from(transactions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date));
}

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(transactions).values(data);
}

export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [monthIncome, lastMonthIncome, totalClients, totalProducts, monthAppointments, lowStock] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` }).from(transactions)
      .where(and(eq(transactions.type, "income"), gte(transactions.date, startOfMonth))),
    db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` }).from(transactions)
      .where(and(eq(transactions.type, "income"), gte(transactions.date, startOfLastMonth), lte(transactions.date, endOfLastMonth))),
    db.select({ count: sql<number>`COUNT(*)` }).from(clients).where(eq(clients.active, true)),
    db.select({ count: sql<number>`COUNT(*)` }).from(products).where(eq(products.active, true)),
    db.select({ count: sql<number>`COUNT(*)` }).from(groomingAppointments)
      .where(and(gte(groomingAppointments.scheduledAt, startOfMonth))),
    db.select({ count: sql<number>`COUNT(*)` }).from(products)
      .where(sql`${products.stock} <= ${products.minStock}`),
  ]);

  // Monthly revenue for chart (last 6 months)
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const [income] = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(transactions)
      .where(and(eq(transactions.type, "income"), gte(transactions.date, start), lte(transactions.date, end)));
    const [expense] = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(transactions)
      .where(and(eq(transactions.type, "expense"), gte(transactions.date, start), lte(transactions.date, end)));
    monthlyRevenue.push({
      month: start.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      income: parseFloat(income?.total ?? "0"),
      expense: parseFloat(expense?.total ?? "0"),
    });
  }

  return {
    monthIncome: parseFloat(monthIncome[0]?.total ?? "0"),
    lastMonthIncome: parseFloat(lastMonthIncome[0]?.total ?? "0"),
    totalClients: Number(totalClients[0]?.count ?? 0),
    totalProducts: Number(totalProducts[0]?.count ?? 0),
    monthAppointments: Number(monthAppointments[0]?.count ?? 0),
    lowStockCount: Number(lowStock[0]?.count ?? 0),
    monthlyRevenue,
  };
}

// ─── Marketing Campaigns ──────────────────────────────────────────────────────
export async function getCampaigns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketingCampaigns).orderBy(desc(marketingCampaigns.createdAt));
}

export async function createCampaign(data: InsertMarketingCampaign) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(marketingCampaigns).values(data);
  const inserted = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.id, (result as any).insertId)).limit(1);
  return inserted[0];
}

export async function updateCampaign(id: number, data: Partial<InsertMarketingCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(marketingCampaigns).set(data).where(eq(marketingCampaigns.id, id));
  const result = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.id, id)).limit(1);
  return result[0];
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(marketingCampaigns).where(eq(marketingCampaigns.id, id));
}
