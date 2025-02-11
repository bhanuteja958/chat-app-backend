import { KafkaConfig } from "kafkajs";

export const KAFKA_CONFIG: KafkaConfig = {
    clientId: "chat-app-backend",
    brokers: ["localhost:9092"],
};
