import { IncomingMessage } from "http";
import WebSocket from "ws";
import { SOCKET_MESSAGE_TYPES } from "../common/constants";

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
        uiStatus: string;
        currentViewingChat: number | null;
        userId?: number;
    }

    interface iChatUIStatus {
        offset: number;
        isInitialFetchDone: boolean;
    }

    interface iClientData {
        connection: WebSocketExt;
        friendsChatData: Record<number, iChatUIStatus>;
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

    interface iMessageWithSentDate extends iMessage {
        sentDate: string;
    }

    interface iFriendRequest {
        friendId: number;
        friendForId: number;
    }

    interface iFriendDetails {
        userId: number;
        fullName: string;
        profilePic: string;
        email: string;
    }

    type iSocketMessageType = `${SOCKET_MESSAGE_TYPES}`;

    interface iSocketMessage {
        type: iSocketMessageType;
        data: any;
    }

    interface iUserInfo {
        userId: number;
        fullName: string;
        profilePic: string | null;
        dob: string;
        is_verified: 0 | 1;
    }

    namespace Express {
        export interface Request {
            user?: iDecodedToken;
        }
    }
}

export {};
