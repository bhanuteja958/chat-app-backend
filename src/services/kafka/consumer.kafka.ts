import { Kafka } from "kafkajs";
import { createDirectMessage } from "../direct-messages.services";
import { KAFKA_CONFIG } from "../../config/kafka";

const kafka = new Kafka(KAFKA_CONFIG);

let lastOffset = -1;

export const consumeMessages = async () => {
    try {
        const consumer = kafka.consumer({
            groupId: "dm-group",
        });

        await consumer.connect();

        await consumer.subscribe({
            topics: ["direct-messages"],
        });

        await consumer.run({
            autoCommit: false,
            eachMessage: async ({ topic, partition, message }) => {
                const offset: number = Number(message.offset);
                try {
                    if (lastOffset !== offset) {
                        const payloadString = message.value.toString();
                        const payload = JSON.parse(payloadString);
                        const dbInsertId = await createDirectMessage({
                            fromId: payload.fromId,
                            toId: payload.toId,
                            message: payload.content,
                            sentDate: payload.sentDate,
                            deliveredDate: payload.deliveredDate,
                        });

                        if (!dbInsertId) {
                            console.error("Error while storing messages in db");
                        } else {
                            await consumer.commitOffsets([
                                {
                                    topic: topic,
                                    partition: partition,
                                    offset: (offset + 1).toString(),
                                },
                            ]);
                            lastOffset = offset;
                        }
                    } else {
                        console.log("Error while storing messages in db");
                    }
                } catch (error) {
                    console.log("Error while storing messages in db", error);
                }
            },
        });
    } catch (error) {
        console.log(
            "Error while starting consuming messages",
            error.message || error,
        );
        process.exit(0);
    }
};
