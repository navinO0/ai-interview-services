import { Kafka, Producer, Consumer, EachMessageHandler } from 'kafkajs';
import config from '../config/env';
import pino from 'pino';

const logger = pino();

class KafkaService {
    private kafka: Kafka;
    private producer: Producer;
    private consumers: Consumer[] = [];

    constructor() {
        this.kafka = new Kafka({
            clientId: config.kafka.clientId,
            brokers: config.kafka.brokers,
        });
        this.producer = this.kafka.producer();
    }

    async connect() {
        try {
            await this.producer.connect();
            logger.info('Kafka Producer connected');
        } catch (error) {
            logger.error({ error }, 'Failed to connect Kafka Producer');
        }
    }

    async publish(topic: string, message: any) {
        try {
            await this.producer.send({
                topic,
                messages: [{ value: JSON.stringify(message) }],
            });
        } catch (error) {
            logger.error({ error, topic }, 'Failed to publish message to Kafka');
        }
    }

    async subscribe(topic: string, groupId: string, onMessage: EachMessageHandler) {
        const consumer = this.kafka.consumer({ groupId });
        try {
            await consumer.connect();
            await consumer.subscribe({ topic, fromBeginning: false });
            await consumer.run({ eachMessage: onMessage });
            this.consumers.push(consumer);
            logger.info(`Kafka Consumer subscribed to topic: ${topic}`);
        } catch (error) {
            logger.error({ error, topic }, 'Failed to subscribe to Kafka topic');
        }
    }

    async disconnect() {
        await this.producer.disconnect();
        for (const consumer of this.consumers) {
            await consumer.disconnect();
        }
        logger.info('Kafka connections closed');
    }
}

export default new KafkaService();
