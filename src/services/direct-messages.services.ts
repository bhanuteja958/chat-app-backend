import { FieldPacket, PoolConnection, ResultSetHeader } from "mysql2/promise";
import pool from "../config/sql";

export const createDirectMessage = async ({
    fromId,
    toId,
    message,
    sentDate,
    deliveredDate,
}) => {
    let connection: PoolConnection = null;
    try {
        connection = await pool.getConnection();
        const [results]: [ResultSetHeader, FieldPacket[]] = await pool.query(
            `INSERT INTO direct_messages(from_id, to_id, message, sent_date, delivered_date) VALUES (?,?,?,?,?)`,
            [fromId, toId, message, sentDate, deliveredDate],
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
