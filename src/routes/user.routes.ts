import express, { Request, Response, Router } from "express";
import { HTTP_STATUS } from "../common/constants";
import { errorResponse } from "../common/helpers";
import { getUserInfo } from "../controller/user.controller";

const userRouter: Router = express.Router();

userRouter.get("/info", async (req: Request, res: Response) => {
    try {
        const result: iControllerResponse = await getUserInfo(req);
        res.status(result.status).json(result.response);
    } catch (error) {
        res.status(HTTP_STATUS.internalServerError).json(
            errorResponse("Something went wrong"),
        );
    }
});

export default userRouter;
