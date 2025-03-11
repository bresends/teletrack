import { and, eq, lte } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { habitSchedules, habits, users } from "../../db/schema.ts";

export async function fetchDueReminders() {
	try {
		const currentTime = new Date();
		return await db
			.select({
				habitId: habitSchedules.habitId,
				habitName: habits.name,
				habitMessage: habits.reminderMessage,
				nextReminder: habitSchedules.nextReminder,
				scheduleType: habitSchedules.scheduleType,
				frequency: habitSchedules.frequency,
				daysOfWeek: habitSchedules.daysOfWeek,
				dayOfMonth: habitSchedules.dayOfMonth,
				intervalValue: habitSchedules.intervalValue,
				intervalUnit: habitSchedules.intervalUnit,
				startTime: habitSchedules.startTime,
				endTime: habitSchedules.endTime,
				reminderInterval: habitSchedules.reminderInterval,
				chatId: users.chatId,
				isActive: habitSchedules.isActive,
				endDate: habitSchedules.lastReminder,
			})
			.from(habitSchedules)
			.innerJoin(habits, eq(habitSchedules.habitId, habits.id))
			.innerJoin(users, eq(habits.userId, users.id))
			.where(
				and(
					lte(habitSchedules.nextReminder, currentTime),
					eq(habitSchedules.isActive, true),
				),
			);
	} catch (error) {
		console.error("Error checking reminders:", error);
		return [];
	}
}
