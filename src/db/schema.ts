import {
	boolean,
	integer,
	pgTable,
	serial,
	time,
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

	scheduleType: varchar("schedule_type", {
		enum: ["fixed", "interval"],
	}).notNull(),

	// For fixed schedules (daily/weekly/monthly)
	frequency: varchar("frequency", {
		enum: ["daily", "weekly", "monthly", "yearly"],
	}),
	daysOfWeek: integer("days_of_week").array(), // [0-6] for weekly
	dayOfMonth: integer("day_of_month"), // 1-31

	// For interval-based schedules
	intervalValue: integer("interval_value"), // e.g., 4
	intervalUnit: varchar("interval_unit", {
		enum: ["days", "weeks", "months"],
	}),

	// Time window configuration
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	reminderInterval: integer("reminder_interval").notNull(), // Minutes between reminders

	// Tracking
	nextReminder: timestamp("next_reminder"),
	isActive: boolean("is_active").default(true),
});

// Drop this table
export const messages = pgTable("messages", {
	id: serial("id").primaryKey(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	latestMessage: varchar("latest_message"),
});
