import type { ReminderMessageStrategy } from "../../contracts/ReminderMessageStrategy";
import { DefaultReminderMessage } from "./DefaultReminderMessage";
import { StreakReminderMessage } from "./StreakReminderMessage";
import { TimeToCompleteReminderMessage } from "./TimeToCompleteReminderMessage";

export function createReminderMessage(
	strategy?: "default" | "streak" | "timeToComplete",
): ReminderMessageStrategy {
	switch (strategy) {
		case "streak":
			return new StreakReminderMessage();
		case "timeToComplete":
			return new TimeToCompleteReminderMessage();
		default:
			return new DefaultReminderMessage();
	}
}
