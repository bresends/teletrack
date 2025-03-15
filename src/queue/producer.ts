import amqp, { type Channel } from "amqplib";
import { config } from "env";

export class Producer {
	private channel!: Channel;

	async createChannel() {
		const connection = await amqp.connect(config.AMQP_URL);
		this.channel = await connection.createChannel();
	}

	async publishMessage({
		routingKey,
		message,
	}: { routingKey: string; message: string }) {
		if (!this.channel) await this.createChannel();

		await this.channel.assertExchange(config.AMQP_EXCHANGE_NAME, "direct", {
			durable: true,
		});

		const logDetails = {
			logType: routingKey,
			message: message,
			dateTime: new Date(),
		};

		await this.channel.publish(
			config.AMQP_EXCHANGE_NAME,
			routingKey,
			Buffer.from(JSON.stringify(logDetails)),
		);

		console.log(
			`The new ${routingKey} log is sent to exchange ${config.AMQP_EXCHANGE_NAME}`,
		);
	}
}
