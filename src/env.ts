import env from "env-var";

export const config = {
	NODE_ENV: env
		.get("NODE_ENV")
		.default("development")
		.asEnum(["production", "test", "development"]),
	BOT_TOKEN: env.get("BOT_TOKEN").required().asString(),

	PORT: env.get("PORT").default(3000).asPortNumber(),
	API_URL: env
		.get("API_URL")
		.default(`https://${env.get("PUBLIC_DOMAIN").asString()}`)
		.asString(),
	DATABASE_URL: env.get("DATABASE_URL").required().asString(),
	AMQP_URL: env.get("AMQP_URL").required().asString(),
	AMQP_EXCHANGE_NAME: env.get("AMQP_EXCHANGE_NAME").required().asString(),
	AMQP_QUEUE_NAME: env.get("AMQP_QUEUE_NAME").required().asString(),
};
