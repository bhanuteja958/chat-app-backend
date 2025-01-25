import "dotenv/config";
import express, { Express } from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import { API_VERSION } from "./common/constants";
import authRouter from "./routes/auth.routes";
import { authMiddleWare } from "./middlewares/auth.middleware";

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

app.listen(3000, () => {
    console.log(`Server listening on port ${PORT}...`);
});
