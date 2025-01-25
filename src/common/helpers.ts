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
