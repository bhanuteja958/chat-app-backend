import { Request } from "express";
import { userInfo } from "../services/user.services";
import { createResponse } from "../common/helpers";
import { HTTP_STATUS } from "../common/constants";

export const getUserInfo = async (req: Request) => {
    try {
        const { userId } = req.user;
        const userDetails: iUserInfo | null = await userInfo(userId);
        if (!userDetails) {
            return {
                status: HTTP_STATUS.badRequest,
                response: createResponse(
                    false,
                    "User doesnot exists with the given ID",
                ),
            };
        }

        return {
            status: HTTP_STATUS.ok,
            response: createResponse(
                true,
                "Successfully fetched user details",
                userDetails,
            ),
        };
    } catch (error) {
        throw error;
    }
};
