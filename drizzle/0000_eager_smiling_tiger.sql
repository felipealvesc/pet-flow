CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`cpf` text,
	`notes` text,
	`active` integer DEFAULT true,
	`lastVisit` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `grooming_appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`petId` integer NOT NULL,
	`clientId` integer NOT NULL,
	`service` text DEFAULT 'bath',
	`status` text DEFAULT 'scheduled',
	`scheduledAt` integer NOT NULL,
	`completedAt` integer,
	`price` real DEFAULT 0,
	`notes` text,
	`groomer` text,
	`checkInToken` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `marketing_campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`discountPercent` integer DEFAULT 0,
	`targetDaysInactive` integer DEFAULT 30,
	`status` text DEFAULT 'draft',
	`sentCount` integer DEFAULT 0,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clientId` integer NOT NULL,
	`name` text NOT NULL,
	`species` text DEFAULT 'dog',
	`breed` text,
	`size` text DEFAULT 'medium',
	`weight` real,
	`birthDate` integer,
	`color` text,
	`observations` text,
	`vaccinations` text,
	`imageUrl` text,
	`active` integer DEFAULT true,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`description` text,
	`category` text,
	`brand` text,
	`price` real DEFAULT 0 NOT NULL,
	`costPrice` real DEFAULT 0,
	`stock` integer DEFAULT 0,
	`minStock` integer DEFAULT 5,
	`unit` text DEFAULT 'un',
	`tags` text,
	`imageUrl` text,
	`active` integer DEFAULT true,
	`aiGenerated` integer DEFAULT false,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`category` text,
	`description` text,
	`amount` real NOT NULL,
	`date` integer NOT NULL,
	`clientId` integer,
	`appointmentId` integer,
	`productId` integer,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastSignedIn` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);