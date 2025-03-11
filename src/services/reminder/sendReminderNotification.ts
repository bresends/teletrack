import { bot } from "bot";
import { createReminderMessage } from "./ReminderMessageFactory";

export async function sendReminderNotification(reminder: {
	habitName: string;
	chatId: string;
	messageTemplate: string;
	strategy?: "default" | "streak" | "timeToComplete";
	currentStreak?: number;
	longestStreak?: number;
	endDate?: Date;
}) {
	try {
		const context = {
			habitName: reminder.habitName,
			messageTemplate: reminder.messageTemplate,
			currentStreak: reminder.currentStreak,
			longestStreak: reminder.longestStreak,	
			endDate: reminder.endDate,
		};

		const strategy = createReminderMessage(reminder.strategy);
		const message = strategy.buildMessage(context);

		await bot.api.sendMessage({
			chat_id: reminder.chatId,
			text: message,
		});
	} catch (error) {
		console.error("Failed to send reminder:", error);
	}
}
