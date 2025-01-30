import { NextFunction, Request, Response } from "express";
import {
    createResponse,
    errorResponse,
    validateAccessToken,
} from "../common/helpers";
import { JwtPayload, verify } from "jsonwebtoken";
import { HTTP_STATUS } from "../common/constants";

const NoAuthRequiredUrls = ["/api/v1/auth/login", "/api/v1/auth/register"];

export const authMiddleWare = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        if (NoAuthRequiredUrls.includes(req.url)) {
            next();
            return;
        }
        const accessToken = req?.cookies?.accessToken;
        if (!accessToken) {
            res.status(HTTP_STATUS.unauthorized).json(
                createResponse(false, "You are an unauthorized user"),
            );
            return;
        } else {
            const verificationResult: string | JwtPayload =
                validateAccessToken(accessToken);

            if (typeof verificationResult === "string") {
                res.status(HTTP_STATUS.unauthorized).json(
                    createResponse(false, verificationResult),
                );
                return;
            } else {
                req.user = verificationResult;
                next();
            }
        }
    } catch (error) {
        res.status(HTTP_STATUS.internalServerError).json(
            errorResponse(error.message),
        );
    }
};
