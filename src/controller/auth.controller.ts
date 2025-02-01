import { Request } from "express";
import { LOGIN, REGISTER } from "../schema/auth.schema";
import { createResponse } from "../common/helpers";
import {
    checkIfUserExistsWithEmail,
    createUser,
    getUserIdAndPasswordHash,
} from "../services/auth.services";
import argon2 from "argon2";
import { sign } from "jsonwebtoken";
import { HTTP_STATUS } from "../common/constants";

export const registerUser = async (req: Request) => {
    try {
        const payload = req.body;
        const isValidRegisterPayload = await REGISTER.isValid(payload);

        if (!isValidRegisterPayload) {
            return {
                status: HTTP_STATUS.badRequest,
                response: createResponse(
                    false,
                    "Something wrong with the payload",
                ),
            };
        }

        const isUserExists = await checkIfUserExistsWithEmail(payload.email);
        if (isUserExists) {
            return {
                status: HTTP_STATUS.badRequest,
                response: createResponse(
                    false,
                    "User already exists with the given email",
                ),
            };
        }

        const passwordHash = await argon2.hash(payload.password);
        payload.passwordHash = passwordHash;
        payload.dob = new Date(payload.dob);
        delete payload.password;

        const userId = await createUser(payload);

        if (!userId) {
            return {
                status: HTTP_STATUS.badRequest,
                response: createResponse(false, "Something went wrong"),
            };
        }

        return {
            status: HTTP_STATUS.created,
            response: createResponse(true, "Successfully created user"),
        };
    } catch (error) {
        throw error;
    }
};

export const loginUser = async (req: Request) => {
    try {
        const payload = req.body;
        const isValidLoginPayload = await LOGIN.isValid(payload);

        if (!isValidLoginPayload) {
            return {
                status: HTTP_STATUS.badRequest,
                response: createResponse(
                    false,
                    "Something wrong with the payload",
                ),
            };
        }

        const userIdAndPassWordHash = await getUserIdAndPasswordHash(
            payload.email,
        );

        if (!userIdAndPassWordHash) {
            return {
                status: HTTP_STATUS.notFound,
                response: createResponse(
                    false,
                    "User does not exists with the given email",
                ),
            };
        }

        const { user_id, password_hash } = userIdAndPassWordHash;

        const isPasswordMatching = await argon2.verify(
            password_hash,
            payload.password,
        );

        if (!isPasswordMatching) {
            return {
                status: HTTP_STATUS.badRequest,
                response: createResponse(false, "Incorrect password"),
            };
        }

        const accessToken = sign(
            {
                userId: user_id,
                email: payload.email,
            },
            process.env.JWT_ACCESS_KEY,
            {
                expiresIn: "3h",
            },
        );

        return {
            status: HTTP_STATUS.ok,
            response: createResponse(true, "Successfully logged in"),
            cookies: {
                accessToken,
            },
        };
    } catch (error) {
        throw error;
    }
};
