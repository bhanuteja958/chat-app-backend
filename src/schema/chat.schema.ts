import { number, object, string } from "yup";

export const MESSSAGE = object({
    fromId: number().required(),
    toId: number().required(),
    content: string().required(),
});
