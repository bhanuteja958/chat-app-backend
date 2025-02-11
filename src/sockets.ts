import { RawData, WebSocketServer } from "ws";
import { Server } from "http";
import internal from "stream";
import {
    createResponse,
    getCookiesObject,
    getDateForDBStorage,
    validateAccessToken,
} from "./common/helpers";
import { URL } from "url";
import { MESSSAGE } from "./schema/chat.schema";
import producer from "./services/kafka/producer.kafka";

(async function () {
    try {
        await producer.connect();
    } catch (error) {
        process.exit(1);
    }
})();

const HEARTBEAT_INTERVAL = 1000 * 15; // 15 seconds

export const clients: Record<number, WebSocketExt> = {};

const wss = new WebSocketServer({
    noServer: true,
});

const hearbeatInterval = setInterval(() => {
    wss.clients.forEach((client: WebSocketExt) => {
        if (!client.isAlive) {
            client.terminate();
        } else {
            client.isAlive = false;
            client.ping();
        }
    });
}, HEARTBEAT_INTERVAL);

wss.on("connection", (ws: WebSocketExt, req: IncomingMessageExt) => {
    ws.isAlive = true;
    clients[req.user.userId] = ws;

    if (req.user) {
        ws.userId = req.user.userId;
    } else {
        ws.terminate();
    }

    ws.on("open", () => {
        console.log("Connection opened");
    });

    ws.on("message", async (data: RawData, isBinary: boolean) => {
        let response = {};
        let isValidMessage = true;
        let message: Record<string, any> = {};
        try {
            message = JSON.parse(data.toString()) as iMessage;
            isValidMessage = await MESSSAGE.isValid(message);
        } catch (error) {
            isValidMessage = false;
        }

        if (!isValidMessage) {
            response = createResponse(false, "Invalid message payload");
            ws.send(JSON.stringify(response), (error) => {
                if (error) {
                    console.error(error);
                }
            });
        } else {
            const sendPayload = {
                fromId: message.fromId,
                toId: message.toId,
                content: message.content,
                sentDate: getDateForDBStorage(),
            };
            response = createResponse(
                true,
                "Successfully received message",
                message,
            );
            clients[message.toId].send(
                JSON.stringify(sendPayload),
                async (error) => {
                    if (error) {
                        console.error("Error while sending message to user");
                    } else {
                        await producer.send({
                            topic: "direct-messages",
                            messages: [
                                {
                                    key: "direct-message",
                                    value: JSON.stringify({
                                        ...sendPayload,
                                        deliveredDate: getDateForDBStorage(),
                                    }),
                                },
                            ],
                        });
                    }
                },
            );
        }
    });

    ws.on("close", (code: number, reson: Buffer) => {
        console.log("Connection closed");
    });

    ws.on("error", (code: number, reason: Buffer) => {
        console.error("Some error occured");
    });

    ws.on("pong", () => {
        ws.isAlive = true;
    });
});

wss.on("close", () => {
    clearInterval(hearbeatInterval);
});

const configureWebSocket = (server: Server) => {
    server.on(
        "upgrade",
        (req: IncomingMessageExt, socket: internal.Duplex, head: Buffer) => {
            const parsedUrl: URL = new URL(
                req.url ?? "",
                `http://${req.headers.host}`,
            );

            if (parsedUrl.pathname !== "/api/v1/chat") {
                const responseBody = createResponse(
                    false,
                    "Path not allowed for websocket",
                );
                const response = [
                    "HTTP/1.1 400 Bad Request",
                    "Content-Type: application/json",
                    `Content-Length: ${Buffer.byteLength(JSON.stringify(responseBody))}`,
                    "",
                    JSON.stringify(responseBody),
                ].join("\r\n");

                socket.write(response);
                socket.destroy();
                return;
            }

            const headers = req.headers;
            const cookies = getCookiesObject(headers.cookie);
            const tokenVerifyResp: iTokenVerifyResponse | null =
                cookies?.accessToken
                    ? validateAccessToken(cookies.accessToken)
                    : null;

            if (
                Object.keys(cookies).length === 0 ||
                !tokenVerifyResp.isAuthenticated
            ) {
                const responseBody = createResponse(
                    false,
                    "You are not an authorized user",
                );
                const response = [
                    "HTTP/1.1 401 Unauthorized",
                    "Content-Type: application/json",
                    `Content-Length: ${Buffer.byteLength(JSON.stringify(responseBody))}`,
                    "",
                    JSON.stringify(responseBody),
                ].join("\r\n");
                socket.write(response);
                socket.destroy();
                return;
            }

            req.user = tokenVerifyResp.userData;

            wss.handleUpgrade(
                req,
                socket,
                head,
                (ws: WebSocketExt, req: IncomingMessageExt) => {
                    wss.emit("connection", ws, req);
                },
            );
        },
    );
};

export default configureWebSocket;
