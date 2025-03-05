import { FieldPacket, PoolConnection, RowDataPacket } from "mysql2/promise";
import pool from "../config/sql";

export const userInfo = async (userId: number) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const [result]: [RowDataPacket[], FieldPacket[]] =
            await connection.query(
                `SELECT user_id as userId, email, full_name as fullName, dob, profile_pic as profilePic, is_verified as isVerified FROM users WHERE user_id=? limit 1`,
                [userId],
            );
        return result.length > 0 ? (result[0] as unknown as iUserInfo) : null;
    } catch (error) {
        throw error;
    }
};
