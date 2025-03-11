import type {
	ReminderMessageContext,
	ReminderMessageStrategy,
} from "../../contracts/ReminderMessageStrategy";

export class StreakReminderMessage implements ReminderMessageStrategy {
	buildMessage(context: ReminderMessageContext): string {
		return context.messageTemplate
			.replace(/{{habitName}}/g, context.habitName)
			.replace(/{{streak}}/g, context.streak?.toString() || "0");
	}
}
