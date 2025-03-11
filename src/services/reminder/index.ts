import { checkHabitCompletedToday } from "./checkHabitCompletedToday.ts";
import { fetchDueReminders } from "./fetchDueReminders.ts";
import { sendReminderNotification } from "./sendReminderNotification.ts";
import { updateNextReminderTime } from "./updateNextReminderTime.ts";

export async function checkAndSendDueReminders() {
	try {
		const dueReminders = await fetchDueReminders();

		if (!dueReminders.length) return console.log("No reminders due");

		for (const reminder of dueReminders) {
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
