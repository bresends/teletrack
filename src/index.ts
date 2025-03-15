import { app } from "./web.ts";
import { client } from "./db/index.ts";
import { config } from "./env.ts";
import { bot } from "./telegram/bot.ts";
const signals = ["SIGINT", "SIGTERM"];

for (const signal of signals) {
	process.on(signal, async () => {
		console.log(`Received ${signal}. Initiating graceful shutdown...`);
		await app.stop();
		await bot.stop();
		process.exit(0);
	});
}

process.on("uncaughtException", (error) => {
	console.error(error);
});

process.on("unhandledRejection", (error) => {
	console.error(error);
});

await client.connect();
console.log("🗄️ Database was connected!");
app.listen(config.PORT, () =>
	console.log(`Listening on port ${config.API_URL} ${config.PORT}`),
);
if (config.NODE_ENV === "production")
	await bot.start({
		webhook: {
			url: `${config.API_URL}/${config.BOT_TOKEN}`,
		},
	});
else await bot.start();
