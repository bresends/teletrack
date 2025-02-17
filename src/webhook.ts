import { Elysia } from "elysia";
import { webhookHandler } from "gramio";
import { bot } from "./bot.ts";
import { config } from "./config.ts";

export const app = new Elysia().post(
	`/${config.BOT_TOKEN}`,
	webhookHandler(bot, "elysia"),
);
