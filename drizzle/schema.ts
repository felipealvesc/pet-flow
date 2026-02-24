import {
  int,
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Products table
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  category: text("category"),
  brand: text("brand"),
  price: real("price").notNull().default(0),
  costPrice: real("costPrice").default(0),
  stock: integer("stock").default(0),
  minStock: integer("minStock").default(5),
  unit: text("unit").default("un"),
  tags: text("tags"),
  imageUrl: text("imageUrl"),
  active: integer("active", { mode: "boolean" }).default(true),
  aiGenerated: integer("aiGenerated", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Clients table
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  cpf: text("cpf"),
  notes: text("notes"),
  active: integer("active", { mode: "boolean" }).default(true),
  lastVisit: integer("lastVisit", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// Pets table
export const pets = sqliteTable("pets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("clientId").notNull(),
  name: text("name").notNull(),
  species: text("species").default("dog"),
  breed: text("breed"),
  size: text("size").default("medium"),
  weight: real("weight"),
  birthDate: integer("birthDate", { mode: "timestamp" }),
  color: text("color"),
  observations: text("observations"),
  vaccinations: text("vaccinations"),
  imageUrl: text("imageUrl"),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type Pet = typeof pets.$inferSelect;
export type InsertPet = typeof pets.$inferInsert;

// Grooming appointments table
export const groomingAppointments = sqliteTable("grooming_appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("petId").notNull(),
  clientId: integer("clientId").notNull(),
  service: text("service").default("bath"),
  status: text("status").default("scheduled"),
  scheduledAt: integer("scheduledAt", { mode: "timestamp" }).notNull(),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  price: real("price").default(0),
  notes: text("notes"),
  groomer: text("groomer"),
  checkInToken: text("checkInToken"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type GroomingAppointment = typeof groomingAppointments.$inferSelect;
export type InsertGroomingAppointment = typeof groomingAppointments.$inferInsert;

// Transactions table (for financial dashboard)
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  category: text("category"),
  description: text("description"),
  amount: real("amount").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  clientId: integer("clientId"),
  appointmentId: integer("appointmentId"),
  productId: integer("productId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Marketing campaigns table
export const marketingCampaigns = sqliteTable("marketing_campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  message: text("message").notNull(),
  discountPercent: integer("discountPercent").default(0),
  targetDaysInactive: integer("targetDaysInactive").default(30),
  status: text("status").default("draft"),
  sentCount: integer("sentCount").default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = typeof marketingCampaigns.$inferInsert;
