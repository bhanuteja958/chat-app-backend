import { RawData, WebSocketServer } from "ws";
import { Server } from "http";
import internal from "stream";
import {
    createResponse,
    getCookiesObject,
    validateAccessToken,
} from "./common/helpers";
import { URL } from "url";

const HEARTBEAT_INTERVAL = 1000 * 15; // 15 seconds

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

    if (req.user) {
        ws.userId = req.user.userId;
    } else {
        ws.terminate();
    }

    ws.on("open", () => {
        console.log("Connection opened");
    });

    ws.on("message", (data: RawData, isBinary: boolean) => {
        ws.send(`received data:  ${data.toString()}`, (error) => {
            if (error) {
                console.log(error);
            }
        });
    });

    ws.on("close", (code: number, reson: Buffer) => {
        console.log("Connection closed");
    });

    ws.on("error", (code: number, reason: Buffer) => {
        console.log("Some error occured");
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
