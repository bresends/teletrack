import { DefaultReminderMessage } from "./templates/DefaultReminderMessage";
import { StreakReminderMessage } from "./templates/StreakReminderMessage";
import { TimeToCompleteReminderMessage } from "./templates/TimeToCompleteReminderMessage";

export function createReminderMessage(
	strategy?: "default" | "streak" | "timeToComplete",
) {
	switch (strategy) {
		case "streak":
			return new StreakReminderMessage();
		case "timeToComplete":
			return new TimeToCompleteReminderMessage();
		default:
			return new DefaultReminderMessage();
	}
}
