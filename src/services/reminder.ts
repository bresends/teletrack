import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../db/index.ts";
import { habitLogs, habitSchedules, habits, users } from "../db/schema.ts";
import { sendReminderNotification } from "./messages/sendReminderNotification.ts";

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
				isActive: habitSchedules.isActive,
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

		console.log(`Found ${dueReminders.length} reminders due`);

		for (const reminder of dueReminders) {
			// Check if this habit has already been completed today
			const hasCompletedToday = await checkHabitCompletedToday(
				reminder.habitId,
			);

			if (hasCompletedToday) {
				console.log(
					`Habit ${reminder.habitId} already completed today, scheduling for next occurrence`,
				);
				// Skip today's reminders and schedule for next occurrence
				await updateNextReminderTime(reminder, true);
			} else {
				// Send reminder and update for next reminder time
				setTimeout(async () => {
					await sendReminderNotification({
						habitName: reminder.habitName || "",
						chatId: reminder.chatId,
						messageTemplate: "Reminder: {{habitName}}",
					});
					await updateNextReminderTime(reminder, false);
				}, 1000);
			}
		}

		return dueReminders.length;
	} catch (error) {
		console.error("Error checking reminders:", error);
		return 0;
	}
}

// Check if a habit has been completed today
async function checkHabitCompletedToday(habitId: number): Promise<boolean> {
	// Get start and end of today
	const today = new Date();
	const startOfDay = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate(),
	);
	const endOfDay = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate(),
		23,
		59,
		59,
		999,
	);

	// Query for completed habit logs for today
	const completedLogs = await db
		.select()
		.from(habitLogs)
		.where(
			and(
				eq(habitLogs.habitId, habitId),
				eq(habitLogs.done, true),
				gte(habitLogs.createdAt, startOfDay),
				lte(habitLogs.createdAt, endOfDay),
			),
		);

	return completedLogs.length > 0;
}

// Updated to accept skipToNextOccurrence parameter
async function updateNextReminderTime(
	reminder: {
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
	},
	skipToNextOccurrence = false,
) {
	try {
		const baseDate = reminder.nextReminder || new Date();
		const currentTime = new Date();
		const intervalMs = reminder.reminderInterval * 60 * 1000;
		const nextTimeSameDay = new Date(currentTime.getTime() + intervalMs);

		// Check if still within today's time window
		const sameDayEnd = combineDateAndTime(baseDate, reminder.endTime);

		let nextReminderDate: Date;

		if (!skipToNextOccurrence && nextTimeSameDay <= sameDayEnd) {
			// Continue with same-day reminders only if not skipping and still within time window
			nextReminderDate = nextTimeSameDay;
		} else {
			// Calculate next occurrence (next day, week, etc.)
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

		return nextReminderDate;
	} catch (error) {
		console.error("Failed to update reminder:", error);
		throw error;
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
