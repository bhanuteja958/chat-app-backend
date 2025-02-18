import {
    FieldPacket,
    PoolConnection,
    ResultSetHeader,
    RowDataPacket,
} from "mysql2/promise";
import pool from "../config/sql";
import { CHAT_PAGINATION_LIMIT } from "../common/constants";

export const createDirectMessage = async ({
    fromId,
    toId,
    content,
    sentDate,
    deliveredDate,
}) => {
    let connection: PoolConnection = null;
    try {
        connection = await pool.getConnection();
        const [results]: [ResultSetHeader, FieldPacket[]] = await pool.query(
            `INSERT INTO direct_messages(from_id, to_id, content, sent_date, delivered_date) VALUES (?,?,?,?,?)`,
            [fromId, toId, content, sentDate, deliveredDate],
        );
        return results.insertId;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            pool.releaseConnection(connection);
        }
    }
};

export const getLatestSentMessagForUserFromSpecificFriends = async (
    userId: number,
    friends: number[],
) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.query(
                `SELECT friendId, content FROM (SELECT (CASE WHEN from_id != ? THEN from_id else to_id END) AS friendId, content, ROW_NUMBER() OVER (PARTITION BY LEAST(from_id, to_id), GREATEST(from_id, to_id) ORDER BY sent_date DESC) AS row_no FROM direct_messages WHERE (to_id = ? AND from_id in (${friends.join(",")})) or (to_id in (${friends.join(",")}) AND from_id = ?)) AS sent_messages_of_user WHERE row_no = 1`,
                [userId, userId, userId],
            );
        return results.length === 0 ? [] : results;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const getSentMessagesBetweenFriendAndUser = async (
    currentUserId: number,
    friendId: number,
    offset: number,
) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.query(
                `SELECT from_id as fromId, to_id as toId, content, DATE_FORMAT(sent_date, '%Y-%m-%d %H:%i:%s') as sentDate from direct_messages where (from_id = ? and to_id = ?) or (from_id = ?  and to_id = ?) ORDER BY sent_date DESC LIMIT ${CHAT_PAGINATION_LIMIT} OFFSET ${offset}`,
                [currentUserId, friendId, friendId, currentUserId],
            );
        return results;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
