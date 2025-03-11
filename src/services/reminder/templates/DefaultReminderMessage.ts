import type {
	ReminderMessageContext,
	ReminderMessageStrategy,
} from "../strategies/ReminderMessageStrategy";

export class DefaultReminderMessage implements ReminderMessageStrategy {
	buildMessage(context: ReminderMessageContext): string {
		return context.messageTemplate
			.replace(/{{habitName}}/g, context.habitName)
			.replace(/{{currentStreak}}/g, context.currentStreak?.toString() || "0")
			.replace(/{{longestStreak}}/g, context.longestStreak?.toString() || "0");
	}
}
