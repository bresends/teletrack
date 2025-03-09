import { eq, lte } from "drizzle-orm";
import { bot } from "../bot.ts";
import { db } from "../db/index.ts";
import { habitSchedules, habits, users } from "../db/schema.ts";

export async function checkAndSendDueReminders() {
	try {
		const currentTime = new Date();

		const dueReminders = await db
			.select({
				habitId: habitSchedules.habitId,
				habitName: habits.name,
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
				firstName: users.firstName,
			})
			.from(habitSchedules)
			.innerJoin(habits, eq(habitSchedules.habitId, habits.id))
			.innerJoin(users, eq(habits.userId, users.id))
			.where(lte(habitSchedules.nextReminder, currentTime));

		console.log(`Found ${dueReminders.length} reminders due`);

		for (const reminder of dueReminders) {
			await sendReminderNotification(reminder);
			await updateNextReminderTime(reminder);
		}

		return dueReminders.length;
	} catch (error) {
		console.error("Error checking reminders:", error);
		return 0;
	}
}

async function sendReminderNotification(reminder: {
	habitName: string | null;
	chatId: string;
}) {
	try {
		await bot.api.sendMessage({
			chat_id: reminder.chatId,
			text: `Reminder: Time for "${reminder.habitName}"!`,
		});
	} catch (error) {
		console.error("Failed to send reminder:", error);
	}
}

async function updateNextReminderTime(reminder: {
	habitId: number;
	scheduleType: "fixed" | "interval";
	frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
	daysOfWeek: number[] | null;
	dayOfMonth: number | null;
	intervalValue: number | null;
	intervalUnit: "days" | "weeks" | "months" | null;
	startTime: string;
	endTime: string;
	reminderInterval: number;
	nextReminder: Date | null;
}) {
	try {
		const baseDate = reminder.nextReminder || new Date();
		const currentTime = new Date();
		const intervalMs = reminder.reminderInterval * 60 * 1000;
		const nextTimeSameDay = new Date(currentTime.getTime() + intervalMs);

		// Check if still within today's time window
		const sameDayStart = combineDateAndTime(baseDate, reminder.startTime);
		const sameDayEnd = combineDateAndTime(baseDate, reminder.endTime);

		let nextReminderDate: Date;

		if (nextTimeSameDay <= sameDayEnd) {
			nextReminderDate = nextTimeSameDay;
		} else {
			// Calculate next occurrence
			const nextDate = getNextOccurrence({
				scheduleType: reminder.scheduleType,
				frequency: reminder.frequency,
				daysOfWeek: reminder.daysOfWeek,
				dayOfMonth: reminder.dayOfMonth,
				intervalValue: reminder.intervalValue,
				intervalUnit: reminder.intervalUnit,
				baseDate: baseDate,
			});

			nextReminderDate = combineDateAndTime(nextDate, reminder.startTime);
		}

		await db
			.update(habitSchedules)
			.set({ nextReminder: nextReminderDate })
			.where(eq(habitSchedules.habitId, reminder.habitId));
	} catch (error) {
		console.error("Failed to update reminder:", error);
	}
}

// Helper functions
function combineDateAndTime(date: Date, timeStr: string): Date {
	const [hours = 0, minutes = 0] = timeStr.split(":").map(Number);
	const newDate = new Date(date);
	newDate.setHours(hours, minutes, 0, 0);
	return newDate;
}

function getNextOccurrence(params: {
	scheduleType: "fixed" | "interval";
	frequency?: "daily" | "weekly" | "monthly" | "yearly" | null;
	daysOfWeek?: number[] | null;
	dayOfMonth?: number | null;
	intervalValue?: number | null;
	intervalUnit?: "days" | "weeks" | "months" | null;
	baseDate: Date;
}): Date {
	if (params.scheduleType === "fixed") {
		switch (params.frequency) {
			case "daily":
				return addDays(params.baseDate, 1);
			case "weekly":
				return getNextWeeklyDate(params.baseDate, params.daysOfWeek || []);
			case "monthly":
				return addMonths(params.baseDate, 1, params.dayOfMonth || undefined);
			case "yearly":
				return addYears(params.baseDate, 1);
			default:
				throw new Error("Invalid fixed schedule frequency");
		}
	}

	switch (params.intervalUnit) {
		case "days":
			return addDays(params.baseDate, params.intervalValue || 1);
		case "weeks":
			return addDays(params.baseDate, (params.intervalValue || 1) * 7);
		case "months":
			return addMonths(params.baseDate, params.intervalValue || 1);
		default:
			throw new Error("Invalid interval schedule unit");
	}
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

function addMonths(date: Date, months: number, dayOfMonth?: number): Date {
	const result = new Date(date);
	result.setMonth(result.getMonth() + months);

	if (dayOfMonth) {
		const lastDay = new Date(
			result.getFullYear(),
			result.getMonth() + 1,
			0,
		).getDate();
		result.setDate(Math.min(dayOfMonth, lastDay));
	}
	return result;
}

function addYears(date: Date, years: number): Date {
	const result = new Date(date);
	result.setFullYear(result.getFullYear() + years);
	return result;
}

function getNextWeeklyDate(baseDate: Date, daysOfWeek: number[]): Date {
	const currentDay = baseDate.getDay();
	const sortedDays = [...new Set(daysOfWeek)].sort((a, b) => a - b);

	for (const day of sortedDays) {
		if (day > currentDay) {
			return addDays(baseDate, day - currentDay);
		}
	}

	const daysToAdd = 7 - currentDay + sortedDays[0];
	return addDays(baseDate, daysToAdd);
}
