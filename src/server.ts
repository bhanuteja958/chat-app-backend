import "dotenv/config";
import express, { Express } from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import { API_VERSION } from "./common/constants";
import authRouter from "./routes/auth.routes";
import { authMiddleWare } from "./middlewares/auth.middleware";
import { Server } from "http";
import configureWebSocket from "./sockets";
import { validateRequiredEnvironmentVariables } from "./common/helpers";
import {
    consumeMessagesFromDirectMessagesTopic,
    consumeMessagesFromDeliveredUnsentMessagesTopic,
} from "./services/kafka/consumer.kafka";
import { createTopics } from "./services/kafka/topic.kafka";
import friendRouter from "./routes/friend.routes";
import userRouter from "./routes/user.routes";

//checking if all environment variables exists or not
validateRequiredEnvironmentVariables();

const PORT = process.env.PORT || 5000;
const app: Express = express();
app.use(cookieParser());
app.use(express.json());
app.use(authMiddleWare);

const corsOptions: CorsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
};

app.use(cors(corsOptions));

app.use(`${API_VERSION}/auth`, authRouter);
app.use(`${API_VERSION}/friend`, friendRouter);
app.use(`${API_VERSION}/user`, userRouter);

const server: Server = app.listen(PORT, async (error) => {
    if (!error) {
        console.log(`Server listening on port ${PORT}...`);
        try {
            await createTopics();
            await consumeMessagesFromDirectMessagesTopic();
            await consumeMessagesFromDeliveredUnsentMessagesTopic();
            configureWebSocket(server);
        } catch (error) {
            console.error("Error while initiating server", error);
            process.exit(0);
        }
    } else {
        console.error("Error while initiating server", error);
        process.exit(0);
    }
});
