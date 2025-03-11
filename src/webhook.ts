import { Patterns, cron } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { webhookHandler } from "gramio";
import { bot } from "./bot.ts";
import { config } from "./config.ts";
import { checkAndSendDueReminders } from "./services/reminder/index.ts";

export const app = new Elysia()
	.use(
		cron({
			name: "reminderCheck",
			pattern: Patterns.EVERY_5_SECONDS,
			async run() {
				console.log("Checking for due reminders...");
				try {
					const sentCount = await checkAndSendDueReminders();
					if (sentCount > 0) {
						console.log(`Sent ${sentCount} reminders`);
					}
				} catch (error) {
					console.error("Error in reminder check cron job:", error);
				}
			},
		}),
	)
	.post(`/${config.BOT_TOKEN}`, webhookHandler(bot, "elysia"));
