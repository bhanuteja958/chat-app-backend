import { Kafka } from "kafkajs";
import { KAFKA_CONFIG } from "./config.kafka";

const kafka = new Kafka(KAFKA_CONFIG);
const producer = kafka.producer();
export default producer;
