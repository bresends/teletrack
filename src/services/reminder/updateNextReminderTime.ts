import { eq } from "drizzle-orm";
import {
    addDays,
    addMonths,
    addYears,
    combineDateAndTime,
    getNextWeeklyDate,
} from "utils/dateUtils.ts";
import { db } from "../../db/index.ts";
import { habitSchedules } from "../../db/schema.ts";


export async function updateNextReminderTime(
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