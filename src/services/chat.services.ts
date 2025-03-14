import { Message, Producer, ProducerRecord } from "kafkajs";
import { RawData } from "ws";
import { createSocketResponse, getDateForDBStorage } from "../common/helpers";
import producer from "./kafka/producer.kafka";
import {
    createUnsentMessage,
    getAllUnsentMessagesBetweenFriendAndUser,
    getUnsentMessagesCountFromEachFriend,
} from "./unsent-messages.services";
import { SOCKET_MESSAGE_TYPES, UI_STATUS } from "../common/constants";
import { getLatestMessagesForUserFromEachFriend } from "./messages.services";
import { getSentMessagesBetweenFriendAndUser } from "./direct-messages.services";
import { checkIfFriends, getFriendsIdList } from "./friend.services";
import { clients } from "../sockets";

const pushMessagesToTopic = async (
    producer: Producer,
    topicName: string,
    messages: Message[],
) => {
    const kafkaEvent: ProducerRecord = {
        topic: topicName,
        messages,
    };
    try {
        await producer.send(kafkaEvent);
    } catch (error) {
        console.log(error);
    }
};

const sendResponseToUser = (
    client: WebSocketExt,
    payload: iSocketMessage,
    afterResponseProcess?: () => Promise<void> | void,
) => {
    if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload), async (socketError: Error) => {
            if (socketError) {
                console.log(socketError.message);
            } else {
                try {
                    afterResponseProcess && (await afterResponseProcess());
                } catch (error) {
                    console.log(error);
                }
            }
        });
    } else {
        console.log("Websocker connection already closed");
    }
};

export const sendDirectMessageToUser = async (
    message: iMessage,
    userId: number,
) => {
    try {
        const { fromId, toId, content } = message;
        const user: iClientData = clients[userId];

        const chatData: iMessageWithSentDate = {
            fromId: fromId,
            toId: toId,
            content: content,
            sentDate: getDateForDBStorage(),
        };

        const areFriends = await checkIfFriends(fromId, toId);

        if (areFriends) {
            if (clients[toId]) {
                const response = createSocketResponse(
                    clients[toId].connection.currentViewingChat === userId
                        ? SOCKET_MESSAGE_TYPES.messageFromChattingFriend
                        : SOCKET_MESSAGE_TYPES.messageFromNotChattingFriend,
                    chatData,
                );
                sendResponseToUser(
                    clients[toId].connection,
                    response,
                    async () => {
                        await pushMessagesToTopic(producer, "direct-messages", [
                            {
                                key: "direct-message",
                                value: JSON.stringify({
                                    ...chatData,
                                    deliveredDate: getDateForDBStorage(),
                                }),
                            },
                        ]);
                        user.friendsChatData[toId].offset += 1;
                        if (clients[toId].friendsChatData[userId]) {
                            clients[toId].friendsChatData[userId].offset += 1;
                        }
                    },
                );
            } else {
                await createUnsentMessage(chatData);
                user.friendsChatData[toId].offset += 1;
            }
        } else {
            const response = createSocketResponse(SOCKET_MESSAGE_TYPES.error, {
                message: "You are not friends with the user",
            });
            sendResponseToUser(clients[userId].connection, response);
        }
    } catch (error) {
        throw error;
    }
};

const loadHistoricalChat = async (user: iClientData, friendId: number) => {
    const userFriendChatStatus = user.friendsChatData[friendId];
    let updatedOffset = 0;
    try {
        const historicalChat = await getSentMessagesBetweenFriendAndUser(
            user.connection.userId,
            friendId,
            userFriendChatStatus.offset,
        );
        const response = createSocketResponse(
            SOCKET_MESSAGE_TYPES.historicalChat,
            {
                friendId,
                chat: historicalChat,
            },
        );
        updatedOffset = historicalChat.length;
        sendResponseToUser(user.connection, response, () => {
            userFriendChatStatus.offset += updatedOffset;
        });
    } catch (error) {
        throw error;
    }
};

const sendLatestMessagesFromAFriendToUser = async (
    user: iClientData,
    friendId: number,
) => {
    const userFriendChatStatus = user.friendsChatData[friendId];
    let updatedOffset = 0;
    try {
        const unsentMessagesBetweenUserAndFriendWithId =
            await getAllUnsentMessagesBetweenFriendAndUser(
                user.connection.userId,
                friendId,
            );
        const unsentMessagesBetweenUserAndFriendWithoutId =
            unsentMessagesBetweenUserAndFriendWithId.map((message) => {
                const { fromId, toId, content, sentDate, messageId } = message;
                return {
                    fromId,
                    toId,
                    content,
                    sentDate,
                    messageId,
                };
            });
        const sentMessagesBetweenUserAndFriend =
            await getSentMessagesBetweenFriendAndUser(
                user.connection.userId,
                friendId,
                userFriendChatStatus.offset,
            );
        const historicalChat = [
            ...unsentMessagesBetweenUserAndFriendWithoutId,
            ...sentMessagesBetweenUserAndFriend,
        ];
        updatedOffset = historicalChat.length;
        const response = createSocketResponse(
            SOCKET_MESSAGE_TYPES.historicalChat,
            {
                friendId,
                chat: historicalChat,
            },
        );
        sendResponseToUser(user.connection, response, async () => {
            const deliveredDate = getDateForDBStorage();
            const messagesToPush = unsentMessagesBetweenUserAndFriendWithId
                .filter((message) => message.toId === user.connection.userId)
                .map((message) => {
                    const { id, fromId, toId, content, sentDate } = message;
                    return {
                        id,
                        fromId,
                        toId,
                        content,
                        sentDate,
                        deliveredDate,
                    };
                });
            if (messagesToPush.length > 0) {
                await pushMessagesToTopic(
                    producer,
                    "delivered-unsent-messages",
                    [
                        {
                            key: "delivered-unsent-message",
                            value: JSON.stringify(messagesToPush),
                        },
                    ],
                );
            }
            user.friendsChatData[friendId].offset += updatedOffset;
            user.friendsChatData[friendId].isInitialFetchDone = true;
        });
    } catch (error) {
        throw error;
    }
};

const handleUIStatusMessage = async (user: iClientData, data: any) => {
    switch (data.status) {
        case UI_STATUS.viewingFriendsList:
            user.connection.uiStatus = UI_STATUS.viewingFriendsList;
            user.connection.currentViewingChat = null;
            break;
        case UI_STATUS.openedFriendChat:
            if (!data.friendId) {
                const response = createSocketResponse(
                    SOCKET_MESSAGE_TYPES.error,
                    {
                        message: "You didnot send current chatting friend Id",
                    },
                );
                sendResponseToUser(user.connection, response);
            } else {
                user.connection.currentViewingChat = data.friendId;
                if (!user.friendsChatData[data.friendId]?.isInitialFetchDone) {
                    user.friendsChatData[data.friendId] = {
                        offset: 0,
                        isInitialFetchDone: false,
                    };
                    await sendLatestMessagesFromAFriendToUser(
                        user,
                        data.friendId,
                    );
                }
            }
            break;
        default:
            const response = createSocketResponse(SOCKET_MESSAGE_TYPES.error, {
                message: "Invalid ui status sent",
            });
            sendResponseToUser(user.connection, response);
    }
};

export const handleCommunicationWithUser = async (
    rawData: RawData,
    userId: number,
) => {
    try {
        const message: iSocketMessage = JSON.parse(rawData.toString());
        switch (message.type) {
            case SOCKET_MESSAGE_TYPES.userUIStatus:
                await handleUIStatusMessage(clients[userId], message.data);
                return;
            case SOCKET_MESSAGE_TYPES.messageToFriend:
                await sendDirectMessageToUser(message.data, userId);
                return;
            case SOCKET_MESSAGE_TYPES.loadHistoricalChat:
                await loadHistoricalChat(
                    clients[userId],
                    message.data.friendId,
                );
                return;
            default:
                const response = createSocketResponse(
                    SOCKET_MESSAGE_TYPES.error,
                    {
                        message: "Wrong socket message type",
                    },
                );
                sendResponseToUser(clients[userId].connection, response);
        }
    } catch (error) {
        throw error;
    }
};

export const sendUnsentMessageCountAndEveryFriendLatestMessage = async (
    client: WebSocketExt,
) => {
    try {
        const unsentCountsWithLatestMessages = {};
        const friends = await getFriendsIdList(client.userId);
        const unsentMessageCounts = await getUnsentMessagesCountFromEachFriend(
            client.userId,
        );
        const latestMessages = await getLatestMessagesForUserFromEachFriend(
            client.userId,
            friends,
        );

        unsentMessageCounts.forEach((count) => {
            if (!unsentCountsWithLatestMessages[count.fromId]) {
                unsentCountsWithLatestMessages[count.fromId] = {};
            }
            unsentCountsWithLatestMessages[count.fromId]["count"] =
                count.unsentCount;
        });

        latestMessages.forEach((message) => {
            if (!unsentCountsWithLatestMessages[message.friendId]) {
                unsentCountsWithLatestMessages[message.friendId] = {
                    count: 0,
                };
            }
            unsentCountsWithLatestMessages[message.friendId]["latestMessage"] =
                message.content;
        });

        const response = createSocketResponse(
            SOCKET_MESSAGE_TYPES.unsentMessageCountWithLatestMessage,
            unsentCountsWithLatestMessages,
        );

        sendResponseToUser(client, response);
    } catch (error) {
        throw error;
    }
};
