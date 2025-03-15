import { Patterns, cron } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { webhookHandler } from "gramio";
import { Consumer } from "queue/consumer.ts";
import { bot } from "./telegram/bot.ts";
import { config } from "./env.ts";
import { Producer } from "./queue/producer.ts";

const producer = new Producer();
const consumer = new Consumer();

export const app = new Elysia()
	.use(
		cron({
			name: "reminderCheck",
			pattern: Patterns.EVERY_10_SECONDS,
			async run() {
				// console.log("Checking for due reminders...");
				// try {
				// 	const sentCount = await checkAndSendDueReminders();
				// 	if (sentCount > 0) {
				// 		console.log(`Sent ${sentCount} reminders`);
				// 	}
				// } catch (error) {
				// 	console.error("Error in reminder check cron job:", error);
				// }

				const msg = {
					data: { email: "test", password: "test" },
				};

				await producer.publishMessage({
					routingKey: "reminderCheck",
					message: JSON.stringify(msg),
				});

				consumer.consumeMessages({ routingKey: "reminderCheck" });
			},
		}),
	)
	.post(`/${config.BOT_TOKEN}`, webhookHandler(bot, "elysia"));
