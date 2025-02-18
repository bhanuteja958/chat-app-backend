import { Redis, RedisOptions } from "ioredis";

const redisOptions: RedisOptions = {
    host: "localhost",
    port: 6379,
};

const cache: Redis = new Redis(redisOptions);

cache.on("connect", () => {
    console.log("Connected to redis");
});

cache.on("error", (error) => {
    console.error("Error while connecting to redis", error.message);
});

cache.on("reconnecting", () => {
    console.log("Reconnecting to redis");
});

export default cache;
