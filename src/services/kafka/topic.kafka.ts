import { Admin, ITopicConfig, Kafka } from "kafkajs";
import { KAFKA_CONFIG } from "./config.kafka";

const kafka: Kafka = new Kafka(KAFKA_CONFIG);

const allTopics: ITopicConfig[] = [
    {
        topic: "direct-messages",
        numPartitions: 20,
        replicationFactor: 1,
    },
];

export const createTopics = async () => {
    const admin: Admin = kafka.admin();
    try {
        await admin.connect();
        const existingTopics = await admin.listTopics();

        const topicsNotCreated = allTopics.filter(
            (topic) => !existingTopics.includes(topic.topic),
        );

        if (topicsNotCreated.length === 0) {
            console.log("All topics already created");
        } else {
            const aretopicsCreated = await admin.createTopics({
                topics: topicsNotCreated,
            });

            if (!aretopicsCreated) {
                console.log("Topics not created before are created now");
            }
        }
        await admin.disconnect();
    } catch (error) {
        console.error("Error while creating topics", error.message || error);
        if (admin) {
            await admin.disconnect();
        }
        process.exit(0);
    }
};
