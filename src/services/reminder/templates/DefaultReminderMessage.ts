import type {
	ReminderMessageContext,
	ReminderMessageStrategy,
} from "../strategies/ReminderMessageStrategy";

export class DefaultReminderMessage implements ReminderMessageStrategy {
	buildMessage(context: ReminderMessageContext): string {
		return context.messageTemplate.replace(/{{habitName}}/g, context.habitName);
	}
}
