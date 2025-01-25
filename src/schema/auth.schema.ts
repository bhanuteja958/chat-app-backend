import { date, object, string, InferType } from "yup";

export const REGISTER = object({
    fullName: string().required().min(2),
    dob: date().required(),
    email: string()
        .email()
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        .required(),
    password: string().min(7).max(20),
    profilePicURL: string().notRequired(),
});

export const LOGIN = object({
    email: string()
        .email()
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        .required(),
    password: string().min(7).max(20),
});
