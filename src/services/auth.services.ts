import pool from "../config/sql";
import {
    FieldPacket,
    ResultSetHeader,
    RowDataPacket,
    PoolConnection,
} from "mysql2/promise";

interface iREGISTER {
    fullName: string;
    dob: string;
    passwordHash: string;
    email: string;
    profilePicURL?: string;
}

export const createUser = async (payload: iREGISTER) => {
    let connection: PoolConnection = null;
    try {
        connection = await pool.getConnection();
        const [results]: [ResultSetHeader, FieldPacket[]] =
            await connection.execute(
                "INSERT INTO users(full_name, email, dob, password_hash, profile_pic) VALUES (?,?,?,?,?)",
                [
                    payload.fullName,
                    payload.email,
                    payload.dob,
                    payload.passwordHash,
                    payload.profilePicURL || null,
                ],
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

export const checkIfUserExistsWithEmail = async (email: string) => {
    let connection: PoolConnection = null;
    try {
        connection = await pool.getConnection();
        const [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.execute(
                "SELECT user_id FROM users WHERE email=? LIMIT 1",
                [email],
            );
        return results.length === 1;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            pool.releaseConnection(connection);
        }
    }
};

export const getUserIdAndPasswordHash = async (email: string) => {
    let connection: PoolConnection = null;
    try {
        connection = await pool.getConnection();
        const [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.execute(
                "SELECT user_id, password_hash FROM users WHERE email=? LIMIT 1",
                [email],
            );
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const getUserIdWithEmail = async (email: string) => {
    let connection: PoolConnection = null;
    try {
        connection = await pool.getConnection();
        const [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.execute(
                "SELECT user_id FROM users WHERE email=? LIMIT 1",
                [email],
            );
        return results.length > 0 ? results[0].user_id : null;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
