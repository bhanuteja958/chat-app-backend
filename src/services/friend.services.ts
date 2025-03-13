import { FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "../config/sql";
import { PoolConnection } from "mysql2/promise";
import { FRIEND_REQUEST_STATUS } from "../common/constants";
import cache from "../config/cache";

export const createFriendRequest = async (payload: iFriendRequest) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const [result]: [ResultSetHeader, FieldPacket[]] =
            await connection.query(
                "INSERT INTO friend_requests (friend_id,friend_for_id) VALUES(?,?)",
                [payload.friendId, payload.friendForId],
            );
        return result.insertId;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const getFriendRequestStatusAndId = async (
    friendId: number,
    friendForId: number,
) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        let [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.query(
                `SELECT id, status FROM friend_requests WHERE friend_id = ? and friend_for_id = ? limit 1`,
                [friendId, friendForId],
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

export const getFriendRequestDetails = async (friendRequestId: number) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        let [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.query(
                `SELECT friend_id, friend_for_id, status FROM friend_requests WHERE id=? LIMIT 1`,
                [friendRequestId],
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

export const declineOrReInitiateFriendRequest = async (
    friendRequestId: number,
    status: "pending" | "declined",
) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        let [result]: [ResultSetHeader, FieldPacket[]] = await connection.query(
            `UPDATE friend_requests SET status='${status}' where id=?`,
            [friendRequestId],
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const acceptFriendRequest = async (friendRequestId: number) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let [updateResult]: [ResultSetHeader, FieldPacket[]] =
            await connection.query(
                `UPDATE friend_requests SET status='${FRIEND_REQUEST_STATUS.accepted}' where id=? and status='${FRIEND_REQUEST_STATUS.pending}'`,
                [friendRequestId],
            );

        if (updateResult.affectedRows == 0) {
            throw new Error(
                "Friend request does not exists or already accepted/declined",
            );
        }

        let [getResults]: [RowDataPacket[], FieldPacket[]] =
            await connection.query(
                "SELECT friend_id, friend_for_id from friend_requests where id = ? limit 1",
                [friendRequestId],
            );

        if (getResults.length == 0) {
            throw new Error("Friend request does not exists");
        }

        const friendRequestDetails = getResults[0];
        const { friend_id, friend_for_id } = friendRequestDetails;
        await connection.query(
            `INSERT INTO friends(friend_id, friend_for_id) VALUES(?,?)`,
            [friend_id, friend_for_id],
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const getFriendshipDetails = async (
    friendId: number,
    currentUserId: number,
) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        let [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.query(
                ` SELECT id, is_unfriended FROM friends WHERE (friend_id = ? and friend_for_id = ?) or (friend_for_id = ? and friend_id = ?) limit 1`,
                [friendId, currentUserId, friendId, currentUserId],
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

export const getAllFriends = async (userId: number) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        let [results]: [RowDataPacket[], FieldPacket[]] =
            await connection.query(
                `SELECT user_id as userId, email, full_name as fullName, profile_pic as profilePic FROM users WHERE user_id IN (SELECT (CASE WHEN friend_id = ? THEN friend_for_id ELSE friend_id END) AS friend_user_id FROM friends WHERE (friend_for_id = ? OR friend_id = ?) AND is_unfriended = 0)`,
                [userId, userId, userId],
            );
        return results.length > 0
            ? (results as unknown as iFriendDetails[])
            : [];
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const toggleUnfriendStatus = async (
    friendId: number,
    currentUserId: number,
    unfriend: boolean,
) => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        let [results]: [ResultSetHeader, FieldPacket[]] =
            await connection.query(
                `UPDATE friends SET is_unfriended = 1 where (friend_id = ? and friend_for_id = ?) or (friend_for_id = ? and friend_id =?)`,
                [friendId, currentUserId, friendId, currentUserId],
            );
        return results.affectedRows;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const getFriendsIdList = async (userId: number) => {
    try {
        let friendsIds: number[] = [];
        const userFriendsRedisKey = `friends:${userId}`;
        friendsIds = (await cache.smembers(userFriendsRedisKey)).map(Number);
        if (friendsIds.length === 0) {
            const friendsDetails: iFriendDetails[] =
                await getAllFriends(userId);
            friendsIds = friendsDetails.map((detail) => detail.userId);
        }
        return friendsIds;
    } catch (error) {
        throw error;
    }
};

export const checkIfFriends = async (
    currentUserId: number,
    friendId: number,
) => {
    const currentUserFriendsSetRedisKey = `friends:${currentUserId}`;
    try {
        const isFriend = await cache.sismember(
            currentUserFriendsSetRedisKey,
            friendId,
        );

        if (!isFriend) {
            const friendshipDetails = await getFriendshipDetails(
                friendId,
                currentUserId,
            );

            if (!friendshipDetails) {
                return false;
            } else {
                await cache.sadd(currentUserFriendsSetRedisKey, friendId);
                return true;
            }
        } else {
            return true;
        }
    } catch (error) {
        throw error;
    }
};
