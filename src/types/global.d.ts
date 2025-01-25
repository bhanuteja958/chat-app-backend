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

    namespace Express {
        export interface Request {
            user?: any;
        }
    }
}

export {};
