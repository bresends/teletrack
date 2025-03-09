import {
	boolean,
	integer,
	interval,
	pgTable,
	serial,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	chatId: varchar("chat_id").notNull().unique(), // Telegram chat ID for sending messages
	username: varchar("username"),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const habits = pgTable("habits", {
	id: serial("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }), // Add user reference
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	name: varchar("name"),
});

export const habitLogs = pgTable("habit_logs", {
	id: serial("id").primaryKey(),
	habitId: integer("habit_id")
		.notNull()
		.references(() => habits.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	done: boolean("done").default(false).notNull(),
});

export const habitSchedules = pgTable("habit_schedules", {
	id: serial("id").primaryKey(),
	habitId: integer("habit_id")
		.notNull()
		.references(() => habits.id, { onDelete: "cascade" }),
	recurrence: varchar("recurrence"),
	interval: interval("interval"),
	startAt: timestamp("start_at"),
	nextReminder: timestamp("next_reminder"),
});

// Drop this table
export const messages = pgTable("messages", {
	id: serial("id").primaryKey(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	latestMessage: varchar("latest_message"),
});
