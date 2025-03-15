import { prompt } from "@gramio/prompt";
import { eq } from "drizzle-orm";
import { Bot } from "gramio";
import { db } from "./db/index.ts";
import { users } from "./db/schema.ts";
import { config } from "./env.ts";

export const bot = new Bot(config.BOT_TOKEN)
	.extend(prompt())
	.command("join", async (context) => {
		try {
			const chatId = context.chat.id.toString();

			// Check if user already exists
			const existingUser = await db.query.users.findFirst({
				where: eq(users.chatId, chatId),
			});

			if (existingUser) {
				return context.reply("Você já está registrado! 👍");
			}

			// Get full user data
			const from = context.from;

			await db.insert(users).values({
				chatId: chatId,
				username: from?.username,
				firstName: from?.firstName,
				lastName: from?.lastName,
			});

			context.reply(
				`Bem vindo ao TeleTracker ${context.chat.firstName || ""}! Você foi cadastrado com sucesso.🎉`,
			);
		} catch (error) {
			console.error("Error registering user:", error);

			context.reply(
				"Desculpe, houve um erro ao registrá-lo. Por favor, tente novamente mais tarde.",
			);
		}
	})
	.onStart(({ info }) => console.log(`✨ Bot ${info.username} was started!`));
