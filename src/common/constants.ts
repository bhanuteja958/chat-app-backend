export const API_VERSION = "/api/v1";
export const enum HTTP_STATUS {
    ok = 200,
    created = 201,
    badRequest = 400,
    unauthorized = 401,
    notFound = 404,
    internalServerError = 500,
}
export const enum FRIEND_REQUEST_STATUS {
    pending = "pending",
    accepted = "accepted",
    declined = "declined",
}
