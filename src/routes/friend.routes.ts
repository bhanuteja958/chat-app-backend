import express, { Request, Response, Router } from "express";
import { HTTP_STATUS } from "../common/constants";
import { errorResponse } from "../common/helpers";
import {
    fetchAllFriends,
    handleFriendRequestCreation,
    unfriendUser,
    updateActionOnFriendRequest,
} from "../controller/friend.controller";
const friendRouter: Router = express.Router();

friendRouter.post("/request/create", async (req: Request, res: Response) => {
    try {
        const result: iControllerResponse =
            await handleFriendRequestCreation(req);
        res.status(result.status).json(result.response);
    } catch (error) {
        res.status(HTTP_STATUS.internalServerError).json(
            errorResponse(error.message),
        );
    }
});

friendRouter.put("/request/update", async (req: Request, res: Response) => {
    try {
        const result: iControllerResponse =
            await updateActionOnFriendRequest(req);
        res.status(result.status).json(result.response);
    } catch (error) {
        res.status(HTTP_STATUS.internalServerError).json(
            errorResponse(error.message),
        );
    }
});

friendRouter.put("/unfriend", async (req: Request, res: Response) => {
    try {
        const result: iControllerResponse = await unfriendUser(req);
        res.status(result.status).json(result.response);
    } catch (error) {
        res.status(HTTP_STATUS.internalServerError).json(
            errorResponse(error.message),
        );
    }
});

friendRouter.get("/fetch", async (req: Request, res: Response) => {
    try {
        const result: iControllerResponse = await fetchAllFriends(req);
        res.status(result.status).json(result.response);
    } catch (error) {
        res.status(HTTP_STATUS.internalServerError).json(
            errorResponse(error.message),
        );
    }
});

export default friendRouter;
