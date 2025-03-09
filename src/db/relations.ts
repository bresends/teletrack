import { relations } from "drizzle-orm/relations";
import { habitLogs, habitSchedules, habits, users } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
	habits: many(habits),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
	habit: one(habits, {
		fields: [habitLogs.habitId],
		references: [habits.id],
	}),
}));

export const habitsRelations = relations(habits, ({ many, one }) => ({
	habitLogs: many(habitLogs),
	habitSchedules: many(habitSchedules),
	user: one(users, {
		fields: [habits.userId],
		references: [users.id],
	}),
}));

export const habitSchdulesRelations = relations(habitSchedules, ({ one }) => ({
	habit: one(habits, {
		fields: [habitSchedules.habitId],
		references: [habits.id],
	}),
}));
