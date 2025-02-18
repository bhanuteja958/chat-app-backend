import { JwtPayload, verify } from "jsonwebtoken";

export const createResponse = (
    success: boolean,
    message: string,
    data: any = {},
) => ({
    success,
    message,
    data,
});

export const createSocketResponse = (
    type: iSocketMessageType,
    data: any = {},
) => {
    return {
        type,
        data,
    };
};

export const errorResponse = (errorMessage: string) => {
    return {
        success: false,
        message: errorMessage || "Something went wrong",
        data: {},
    };
};

export const validateAccessToken = (accessToken: string) => {
    try {
        const decodedToken: string | JwtPayload = verify(
            accessToken,
            process.env.JWT_ACCESS_KEY,
        );

        if (
            typeof decodedToken === "string" ||
            !decodedToken.userId ||
            !decodedToken.email
        ) {
            return {
                isAuthenticated: false,
                message: "Invalid token payload",
                userData: null,
            };
        } else {
            return {
                isAuthenticated: true,
                message: "",
                userData: {
                    userId: decodedToken.userId,
                    email: decodedToken.email,
                },
            };
        }
    } catch (error) {
        return {
            isAuthenticated: false,
            message: "You are not an authorized user",
            userData: null,
        };
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

export const validateRequiredEnvironmentVariables = () => {
    const requiredEnvironmentVariables = [
        "DB_NAME",
        "DB_HOST",
        "DB_USER",
        "DB_PASSWORD",
        "JWT_ACCESS_KEY",
    ];

    const areAllEnvironmentVariablesExists = requiredEnvironmentVariables.every(
        (variable) => {
            return process.env[variable] ? true : false;
        },
    );

    if (!areAllEnvironmentVariablesExists) {
        process.exit(1);
    }
};

/* Returns the date from an ISO string without the T in the date*/
export const getDateForDBStorage = () => {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
};
