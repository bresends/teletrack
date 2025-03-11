import { DefaultReminderMessage } from "./templates/DefaultReminderMessage";
import { TimeToCompleteReminderMessage } from "./templates/TimeToCompleteReminderMessage";

export function createReminderMessage(
	strategy?: "default" | "streak" | "timeToComplete",
) {
	switch (strategy) {
		case "timeToComplete":
			return new TimeToCompleteReminderMessage();
		default:
			return new DefaultReminderMessage();
	}
}
