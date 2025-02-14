import { Request } from "express";
import {
    ACTION_ON_FRIEND_REQUEST,
    CREATE_FRIEND_REQUEST,
    UNFRIEND_USER,
} from "../schema/friend.schema";
import { FRIEND_REQUEST_STATUS, HTTP_STATUS } from "../common/constants";
import { createResponse } from "../common/helpers";
import { getUserIdWithEmail } from "../services/auth.services";
import {
    acceptFriendRequest,
    createFriendRequest,
    declineOrReInitiateFriendRequest,
    getAllFriends,
    getFriendRequestDetails,
    getFriendRequestStatusAndId,
    getFriendshipDetails,
    toggleUnfriendStatus,
} from "../services/friend.services";

export const handleFriendRequestCreation = async (req: Request) => {
    try {
        const payload = req.body;
        const isValidFriendRequestPayload: boolean =
            await CREATE_FRIEND_REQUEST.isValid(payload);

        if (!isValidFriendRequestPayload) {
            return {
                status: HTTP_STATUS.badRequest,
                response: createResponse(
                    false,
                    "Something wrong with the request payload",
                ),
            };
        }

        const friendId = await getUserIdWithEmail(payload.email);

        if (!friendId) {
            return {
                status: HTTP_STATUS.badRequest,
                response: createResponse(
                    false,
                    "User does not exist with the given email",
                ),
            };
        }

        const existingFriendRequest = await getFriendRequestStatusAndId(
            friendId,
            req.user.userId,
        );

        if (!existingFriendRequest) {
            const friendRequest: iFriendRequest = {
                friendId,
                friendForId: req.user.userId,
            };

            await createFriendRequest(friendRequest);

            return {
                status: HTTP_STATUS.created,
                response: createResponse(
                    true,
                    "Successfully sent friend request",
                ),
            };
        } else {
            const { friendRequestId, friendRequestStatus } =
                existingFriendRequest;
            if (friendRequestStatus === FRIEND_REQUEST_STATUS.declined) {
                await declineOrReInitiateFriendRequest(
                    friendRequestId,
                    FRIEND_REQUEST_STATUS.pending,
                );

                return {
                    status: HTTP_STATUS.ok,
                    response: createResponse(
                        true,
                        "Successfully sent friend request",
                    ),
                };
            } else if (friendRequestStatus === FRIEND_REQUEST_STATUS.accepted) {
                return {
                    status: 400,
                    response: createResponse(
                        false,
                        "Already a friend of yours",
                    ),
                };
            } else {
                return {
                    status: 400,
                    response: createResponse(
                        false,
                        "Friend request already exists",
                    ),
                };
            }
        }
    } catch (error) {
        throw error;
    }
};

export const updateActionOnFriendRequest = async (req: Request) => {
    try {
        const payload = req.body;
        const isValidActionPayload: boolean =
            await ACTION_ON_FRIEND_REQUEST.isValid(payload);

        if (!isValidActionPayload) {
            return {
                status: 400,
                response: createResponse(
                    false,
                    "Something wrong with the request payload",
                ),
            };
        }

        const { friendRequestId, isAccepted } = payload;
        const existingFriendRequest =
            await getFriendRequestDetails(friendRequestId);

        if (!existingFriendRequest) {
            return {
                status: 400,
                response: createResponse(false, "Friend request doesnot exist"),
            };
        } else {
            const { status } = existingFriendRequest;
            if (status === FRIEND_REQUEST_STATUS.declined) {
                return {
                    status: 400,
                    response: createResponse(
                        false,
                        isAccepted
                            ? "Friend request already declined. Send a new request"
                            : "Friend request already declined",
                    ),
                };
            } else if (status === FRIEND_REQUEST_STATUS.accepted) {
                return {
                    status: 400,
                    response: createResponse(
                        false,
                        "You both are already friends",
                    ),
                };
            } else {
                if (isAccepted) {
                    await acceptFriendRequest(friendRequestId);
                    return {
                        status: 200,
                        response: createResponse(
                            true,
                            "Successfully accepted friend request",
                        ),
                    };
                } else {
                    await declineOrReInitiateFriendRequest(
                        friendRequestId,
                        FRIEND_REQUEST_STATUS.declined,
                    );

                    return {
                        status: 200,
                        response: createResponse(
                            true,
                            "Successfully declined friend request",
                        ),
                    };
                }
            }
        }
    } catch (error) {
        throw error;
    }
};

export const fetchAllFriends = async (req: Request) => {
    try {
        const friends = await getAllFriends(req.user.userId);
        if (friends.length === 0) {
            return {
                status: 400,
                response: createResponse(false, "No friends yet", friends),
            };
        } else {
            return {
                status: 200,
                response: createResponse(
                    true,
                    "Successfully fetched friends",
                    friends,
                ),
            };
        }
    } catch (error) {
        throw error;
    }
};

export const unfriendUser = async (req: Request) => {
    try {
        const payload = req.body;
        const isValidUnfriendPayload: boolean =
            await UNFRIEND_USER.isValid(payload);
        if (!isValidUnfriendPayload) {
            return {
                status: 400,
                response: createResponse(
                    false,
                    "Something wrong with the request payload",
                ),
            };
        }

        const { friendId } = payload;
        const friendShipDetails = await getFriendshipDetails(
            friendId,
            req.user.userId,
        );
        if (!friendShipDetails) {
            return {
                status: 400,
                response: createResponse(
                    false,
                    "User is not a friend of yours to unfriend",
                ),
            };
        } else {
            const { is_unfriended } = friendShipDetails;
            if (is_unfriended) {
                return {
                    status: 400,
                    response: createResponse(
                        false,
                        "User is already unfriended",
                    ),
                };
            } else {
                await toggleUnfriendStatus(friendId, req.user.userId, true);
                return {
                    status: 200,
                    response: createResponse(
                        true,
                        "Sucessfully unfriended user",
                    ),
                };
            }
        }
    } catch (error) {
        throw error;
    }
};
