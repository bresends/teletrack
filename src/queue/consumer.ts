import amqp, { type Channel } from "amqplib";
import { config } from "env";

export class Consumer {
	private channel!: Channel;

	private async createChannel() {
		const connection = await amqp.connect(config.AMQP_URL);
		this.channel = await connection.createChannel();
	}
	async consumeMessages({ routingKey }: { routingKey: string }) {
		if (!this.channel) await this.createChannel();

		await this.channel.assertExchange(config.AMQP_EXCHANGE_NAME, "direct", {
			durable: true,
		});

		const queue = await this.channel.assertQueue(config.AMQP_QUEUE_NAME, {
			durable: true,
		});

		await this.channel.bindQueue(
			queue.queue,
			config.AMQP_EXCHANGE_NAME,
			routingKey,
		);

		await this.channel.consume(
			queue.queue,
			(msg) => {
				if (!msg) throw new Error("No message received");
				const data = JSON.parse(msg.content.toString());

				console.log(data);
				this.channel.ack(msg);
			},
			{
				noAck: false,
			},
		);
	}
}
