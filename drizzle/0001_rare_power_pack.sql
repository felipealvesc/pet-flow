CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`cpf` varchar(14),
	`notes` text,
	`active` boolean DEFAULT true,
	`lastVisit` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grooming_appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`petId` int NOT NULL,
	`clientId` int NOT NULL,
	`service` enum('bath','grooming','bath_grooming','nail','ear','full') DEFAULT 'bath',
	`status` enum('scheduled','arrived','bathing','grooming','ready','completed','cancelled') DEFAULT 'scheduled',
	`scheduledAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`price` decimal(10,2) DEFAULT '0',
	`notes` text,
	`groomer` varchar(100),
	`checkInToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grooming_appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketing_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`discountPercent` int DEFAULT 0,
	`targetDaysInactive` int DEFAULT 30,
	`status` enum('draft','active','paused','completed') DEFAULT 'draft',
	`sentCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketing_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`species` enum('dog','cat','bird','other') DEFAULT 'dog',
	`breed` varchar(100),
	`size` enum('small','medium','large','giant') DEFAULT 'medium',
	`weight` decimal(5,2),
	`birthDate` timestamp,
	`color` varchar(100),
	`observations` text,
	`vaccinations` text,
	`imageUrl` text,
	`active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`description` text,
	`category` varchar(100),
	`brand` varchar(100),
	`price` decimal(10,2) NOT NULL DEFAULT '0',
	`costPrice` decimal(10,2) DEFAULT '0',
	`stock` int DEFAULT 0,
	`minStock` int DEFAULT 5,
	`unit` varchar(20) DEFAULT 'un',
	`tags` text,
	`imageUrl` text,
	`active` boolean DEFAULT true,
	`aiGenerated` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`category` varchar(100),
	`description` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`date` timestamp NOT NULL,
	`clientId` int,
	`appointmentId` int,
	`productId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
