import express, { Request, Response, Router } from "express";
import { loginUser, registerUser } from "../controller/auth.controller";
import { createResponse, errorResponse } from "../common/helpers";
import { HTTP_STATUS } from "../common/constants";

const authRouter: Router = express.Router();

authRouter.post("/register", async (req: Request, res: Response) => {
    try {
        const payload: iControllerResponse = await registerUser(req);
        res.status(payload.status).json(payload.response);
    } catch (error) {
        res.status(HTTP_STATUS.internalServerError).json(
            errorResponse(error.message),
        );
    }
});

authRouter.post("/login", async (req: Request, res: Response) => {
    try {
        const payload: iControllerResponse = await loginUser(req);
        if (payload?.cookies?.accessToken) {
            res.cookie("accessToken", payload.cookies.accessToken, {
                httpOnly: true,
            });
        }
        res.status(payload.status).json(payload.response);
    } catch (error) {
        res.status(HTTP_STATUS.internalServerError).json(
            errorResponse(error.message),
        );
    }
});

authRouter.get("/logout", async (req: Request, res: Response) => {
    try {
        res.clearCookie("accessToken")
            .status(HTTP_STATUS.ok)
            .json(createResponse(true, "Successfully loggedout"));
    } catch (error) {
        res.status(HTTP_STATUS.internalServerError).json(
            errorResponse(error.message),
        );
    }
});

export default authRouter;
