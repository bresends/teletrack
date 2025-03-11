import { bot } from "bot";
import { createReminderMessage } from "./ReminderMessageFactory";

export async function sendReminderNotification(reminder: {
	habitName: string;
	chatId: string;
	messageTemplate: string;
	strategy?: "default" | "streak" | "timeToComplete";
	streak?: number;
	timeToComplete?: number;
}) {
	try {
		const context = {
			habitName: reminder.habitName,
			messageTemplate: reminder.messageTemplate,
			streak: reminder.streak,
			timeToComplete: reminder.timeToComplete,
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
