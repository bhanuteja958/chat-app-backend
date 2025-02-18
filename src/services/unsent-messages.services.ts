import {
    FieldPacket,
    PoolConnection,
    ResultSetHeader,
    RowDataPacket,
} from "mysql2/promise";
import pool from "../config/sql";

export const createUnsentMessage = async (payload: iMessageWithSentDate) => {
    const connection: PoolConnection | null = null;
    try {
        const connection = await pool.getConnection();
        const { fromId, toId, content, sentDate } = payload;
        const [results]: [ResultSetHeader, FieldPacket[]] =
            await connection.query(
                "INSERT INTO unsent_messages(from_id, to_id, content, sent_date) VALUES (?,?,?,?)",
                [fromId, toId, content, sentDate],
            );
        return results.insertId;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const getUnsentMessagesCountFromEachFriend = async (userId: number) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.query(
                "SELECT COUNT(from_id) as unsentCount, from_id as fromId FROM unsent_messages WHERE to_id = ? GROUP BY fromId",
                [userId],
            );
        return results.length === 0 ? [] : results;
    } catch (error) {
        throw error;
    } finally {
    }
};

export const getLatestUnsentMessageForUserFromEachFriend = async (
    userId: number,
) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.query(
                `SELECT friendId, content FROM (SELECT (CASE WHEN from_id != ? THEN from_id else to_id END) as friendId, content, ROW_NUMBER() OVER(PARTITION BY LEAST(from_id, to_id), GREATEST(from_id, to_id) ORDER BY sent_date DESC) AS row_no FROM unsent_messages WHERE to_id = ? or from_id = ?) AS unsent_messages_of_user WHERE row_no = 1`,
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

export const getAllUnsentMessagesBetweenFriendAndUser = async (
    currentUserId: number,
    friendId: number,
) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.query(
                `SELECT id, from_id as fromId, to_id as toId, content, DATE_FORMAT(sent_date, '%Y-%m-%d %H:%i:%s') as sentDate from unsent_messages where (from_id = ? and to_id = ?) or (from_id = ?  and to_id = ?) ORDER BY sent_date DESC limit 10`,
                [currentUserId, friendId, friendId, currentUserId],
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
