import {
    FieldPacket,
    PoolConnection,
    QueryResult,
    ResultSetHeader,
} from "mysql2/promise";
import { getLatestSentMessagForUserFromSpecificFriends } from "./direct-messages.services";
import { getLatestUnsentMessageForUserFromEachFriend } from "./unsent-messages.services";
import pool from "../config/sql";

export const getLatestMessagesForUserFromEachFriend = async (
    userId: number,
    friends: number[],
) => {
    try {
        let latestSentMessages = [];
        let latestUnsentMessages = [];

        latestUnsentMessages =
            await getLatestUnsentMessageForUserFromEachFriend(userId);
        const noUnsentMessageFriends = friends.filter(
            (friendId) =>
                latestUnsentMessages.findIndex(
                    (message) => (message.friendId = friendId),
                ) === -1,
        );
        if (noUnsentMessageFriends.length > 0) {
            latestSentMessages =
                await getLatestSentMessagForUserFromSpecificFriends(
                    userId,
                    noUnsentMessageFriends,
                );
        }
        return [...latestUnsentMessages, ...latestSentMessages];
    } catch (error) {
        throw error;
    }
};

export const bulkMoveFromUnsentToDirectMessages = async (payload: any[]) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [deleteResults]: [ResultSetHeader, FieldPacket[]] =
            await connection.query(
                `DELETE FROM unsent_messages WHERE id in (${Array(payload.length).fill("?").join(",")})`,
                payload.map((unsentMessage) => unsentMessage.id),
            );
        if (deleteResults.affectedRows === 0) {
            throw new Error(
                "Something went wrong while deleting unsent messages",
            );
        }

        let insertResults: ResultSetHeader | null = null;

        if (payload.length === 1) {
            const { fromId, toId, content, sentDate, deliveredDate } =
                payload[0];
            const [results]: [ResultSetHeader, FieldPacket[]] =
                await connection.query(
                    `INSERT INTO direct_messages (from_id, to_id, content, sent_date, delivered_date) VALUES (?, ?, ?, ?, ?) `,
                    [fromId, toId, content, sentDate, deliveredDate],
                );
            insertResults = results;
        } else {
            const [results]: [ResultSetHeader, FieldPacket[]] =
                await connection.query(
                    `INSERT INTO direct_messages (from_id, to_id, content, sent_date, delivered_date) VALUES ? `,
                    [
                        payload.map((unsentMessage) => {
                            const {
                                fromId,
                                toId,
                                content,
                                sentDate,
                                deliveredDate,
                            } = unsentMessage;
                            return [
                                fromId,
                                toId,
                                content,
                                sentDate,
                                deliveredDate,
                            ];
                        }),
                    ],
                );
            insertResults = results;
        }
        if (insertResults.affectedRows > 0) {
            await connection.commit();
            return insertResults.insertId;
        } else {
            await connection.rollback();
        }
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
