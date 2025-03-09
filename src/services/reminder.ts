import { eq, lte } from "drizzle-orm";
import { bot } from "../bot.ts";
import { db } from "../db/index.ts";
import { habitSchedules, habits, users } from "../db/schema.ts";

export async function checkAndSendDueReminders() {
	try {
		const currentTime = new Date();

		// Query for habits with due reminders (where nextReminder <= current time)
		const dueReminders = await db
			.select({
				habitId: habitSchedules.habitId,
				habitName: habits.name,
				nextReminder: habitSchedules.nextReminder,
				recurrence: habitSchedules.recurrence,
				interval: habitSchedules.interval,
				chatId: users.chatId, // Get the user's chat ID
			})
			.from(habitSchedules)
			.innerJoin(habits, eq(habitSchedules.habitId, habits.id))
			.innerJoin(users, eq(habits.userId, users.id))
			.where(lte(habitSchedules.nextReminder, currentTime));

		console.log(`Found ${dueReminders.length} reminders due for sending`);

		// Process each due reminder
		for (const reminder of dueReminders) {
			// await sendReminderNotification(reminder);
			// await updateNextReminderTime(reminder);
		}

		return dueReminders.length;
	} catch (error) {
		console.error("Error checking for due reminders:", error);
		return 0;
	}
}

/**
 * Send a notification for a due habit reminder
 */
async function sendReminderNotification(reminder: {
	habitId: number;
	habitName: string | null;
	chatId: string;
	firstName: string | null;
	nextReminder: Date | null;
}) {
	try {
		console.log(
			`Sending reminder for habit: ${reminder.habitName} to user chat ID: ${reminder.chatId}`,
		);

		// Personalize the message if we have the user's first name
		const greeting = reminder.firstName ? `Hello ${reminder.firstName}! ` : "";

		// Send the actual Telegram message
		await bot.api.sendMessage({
			chat_id: reminder.chatId,
			text: `${greeting}Reminder: Time for your habit "${reminder.habitName}"!`,
		});
	} catch (error) {
		console.error(
			`Failed to send reminder for habit ${reminder.habitId}:`,
			error,
		);
	}
}

/**
 * Update the next reminder time based on recurrence pattern
 */
async function updateNextReminderTime(reminder: {
	habitId: number;
	recurrence: string | null;
	interval: number;
}) {
	try {
		// Calculate next reminder time based on recurrence and interval
		// This is a simplified example - you'd calculate based on your recurrence pattern
		const nextReminderDate = new Date();

		// Add interval (assuming interval is in hours for this example)
		// In a real implementation, parse the actual interval from the database
		nextReminderDate.setHours(nextReminderDate.getHours() + 24);

		// Update the next reminder time in the database
		await db
			.update(habitSchedules)
			.set({ nextReminder: nextReminderDate })
			.where(eq(habitSchedules.habitId, reminder.habitId));

		console.log(
			`Updated next reminder for habit ${reminder.habitId} to ${nextReminderDate}`,
		);
	} catch (error) {
		console.error(
			`Failed to update next reminder for habit ${reminder.habitId}:`,
			error,
		);
	}
}
