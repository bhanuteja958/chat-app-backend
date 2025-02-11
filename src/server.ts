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
import { consumeMessages } from "./services/kafka/consumer.kafka";
import { createTopics } from "./services/kafka/topic.kafka";

//checking if all environment variables exists or not
validateRequiredEnvironmentVariables();

const PORT = process.env.PORT || 3000;
const app: Express = express();
app.use(cookieParser());
app.use(express.json());
app.use(authMiddleWare);

const corsOptions: CorsOptions = {
    origin: "*",
    credentials: true,
};

app.use(cors(corsOptions));

app.use(`${API_VERSION}/auth`, authRouter);

const server: Server = app.listen(3000, async (error) => {
    if (!error) {
        console.log(`Server listening on port ${PORT}...`);
        try {
            await createTopics();
            await consumeMessages();
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
