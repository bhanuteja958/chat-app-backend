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
export const enum SOCKET_MESSAGE_TYPES {
    unsentMessageCountWithLatestMessage = "UNSENT_MESSAGE_COUNT_WITH_LATEST_MESSAGE",
    messageFromNotChattingFriend = "MESSAGE_FROM_NOT_CHATTING_FRIEND",
    messageFromChattingFriend = "MESSAGE_FROM_CHATTING_FRIEND",
    messageToFriend = "MESSAGE_TO_FRIEND",
    historicalChat = "HISTORICAL_CHAT",
    userUIStatus = "USER_UI_STATUS",
    error = "ERROR",
    loadHistoricalChat = "LOAD_HISTORICAL_CHAT",
}

export const enum UI_STATUS {
    viewingFriendsList = "VIEWING_FRIENDS_LIST",
    openedFriendChat = "OPENED_FRIEND_CHAT",
}

export const CHAT_PAGINATION_LIMIT = 10;
