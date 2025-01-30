import { verify } from "jsonwebtoken";

export const createResponse = (
    success: boolean,
    message: string,
    data: any = {},
) => ({
    success,
    message,
    data,
});

export const errorResponse = (errorMessage: string) => {
    return {
        success: false,
        message: errorMessage || "Something went wrong",
        data: {},
    };
};

export const validateAccessToken = (accessToken: string) => {
    try {
        const decodedToken = verify(accessToken, process.env.JWT_ACCESS_KEY);
        return decodedToken;
    } catch (error) {
        return "You are not an authorized user";
    }
};

export const getCookiesObject = (cookiesString: string) => {
    const cookies: Record<string, string> = {};
    if (cookiesString) {
        const individualCookieStrings = cookiesString.split(";");
        individualCookieStrings.forEach((cookieString) => {
            const [cookieKey, ...cookieValueParts] = cookieString
                .trim()
                .split("=");
            if (cookieKey && cookieValueParts.length > 0) {
                cookies[cookieKey.trim()] = cookieValueParts.join("=").trim();
            }
        });
    }

    return cookies;
};
