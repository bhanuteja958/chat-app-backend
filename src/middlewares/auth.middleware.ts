import { NextFunction, Request, Response } from "express";
import { createResponse, errorResponse } from "../common/helpers";
import { verify } from "jsonwebtoken";
import { HTTP_STATUS } from "../common/constants";

const tokenVerificationErrors = [
    "TokenExpiredError",
    "JsonWebTokenError",
    "NotBeforeError",
];

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
            const decodedToken = verify(
                accessToken,
                process.env.JWT_ACCESS_KEY,
            );

            req.user = decodedToken;
            next();
        }
    } catch (error) {
        if (tokenVerificationErrors.includes(error?.name)) {
            res.status(HTTP_STATUS.unauthorized).json(
                createResponse(false, "You are an unauthorized user"),
            );
        } else {
            res.status(HTTP_STATUS.internalServerError).json(
                errorResponse(error.message),
            );
        }
    }
};
