import type {
	ReminderMessageContext,
	ReminderMessageStrategy,
} from "../../contracts/ReminderMessageStrategy";

export class TimeToCompleteReminderMessage implements ReminderMessageStrategy {
	buildMessage(context: ReminderMessageContext): string {
		return context.messageTemplate
			.replace(/{{habitName}}/g, context.habitName)
			.replace(/{timeToComplete}/g, context.timeToComplete?.toString() || "0");
	}
}
