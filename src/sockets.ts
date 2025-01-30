import WebSocket, { RawData, WebSocketServer } from "ws";
import { IncomingMessage, Server } from "http";
import internal from "stream";
import {
    createResponse,
    getCookiesObject,
    validateAccessToken,
} from "./common/helpers";

const wss = new WebSocketServer({
    noServer: true,
});

wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
    ws.on("open", () => {
        console.log("Connection opened");
    });

    ws.on("message", (data: RawData, isBinary: boolean) => {
        ws.send(`received data:  ${data.toString()}`, (error) => {
            console.log(error);
        });
    });

    ws.on("close", (code: number, reson: Buffer) => {
        console.log("Connection closed");
    });

    ws.on("error", (code: number, reason: Buffer) => {
        console.log("Some error occured");
    });
});

const configureWebSocket = (server: Server) => {
    server.on(
        "upgrade",
        (req: IncomingMessage, socket: internal.Duplex, head: Buffer) => {
            const headers = req.headers;
            const cookies = getCookiesObject(headers.cookie);
            if (
                Object.keys(cookies).length === 0 ||
                (cookies.accessToken &&
                    !validateAccessToken(cookies.accessToken))
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

            wss.handleUpgrade(
                req,
                socket,
                head,
                (ws: WebSocket, req: IncomingMessage) => {
                    wss.emit("connection", ws, req);
                },
            );
        },
    );
};

export default configureWebSocket;
