import { IncomingMessage } from "http";
import WebSocket from "ws";

declare global {
    interface iResponse {
        success: boolean;
        message: string;
        data: any;
    }

    interface iControllerResponse {
        status: number;
        response: iResponse;
        cookies?: {
            accessToken: string;
        };
    }

    interface WebSocketExt extends WebSocket {
        isAlive: boolean;
        userId?: number;
    }

    interface iDecodedToken {
        userId: number;
        email: string;
    }
    interface IncomingMessageExt extends IncomingMessage {
        user?: iDecodedToken;
    }

    interface iTokenVerifyResponse {
        isAuthenticated: boolean;
        message: string;
        userData: iDecodedToken;
    }

    interface iMessage {
        fromId: number;
        toId: number;
        content: string;
    }

    namespace Express {
        export interface Request {
            user?: iDecodedToken;
        }
    }
}

export {};
