import { boolean, number, object, string } from "yup";

export const CREATE_FRIEND_REQUEST = object({
    email: string()
        .email()
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        .required(),
});

export const ACTION_ON_FRIEND_REQUEST = object({
    friendRequestId: number().required(),
    isAccepted: boolean().required(),
});

export const UNFRIEND_USER = object({
    friendId: number().required(),
});
