import mysql, { Pool } from "mysql2/promise";

let pool: Pool = null;

try {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: 10,
    });
} catch (error) {
    console.error(
        "Something went wrong when connecting to db",
        error.message || error,
    );
    process.exit(0);
}

export default pool;
