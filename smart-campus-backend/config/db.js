const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

const dbHost = process.env.DB_HOST || "localhost";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || "smart_campus";
const ssl = process.env.DB_SSL === "true" ? {
    ca: fs.readFileSync(path.resolve(__dirname, process.env.DB_SSL_CA || "rds-ap-south-1-ca.pem")),
    rejectUnauthorized: true
} : undefined;

async function ensureDatabase() {
    const connection = await mysql.createConnection({
        host: dbHost,
        port: Number(process.env.DB_PORT || 3306),
        user: dbUser,
        password: dbPassword,
        ssl,
        database: undefined
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.end();
}

const pool = mysql.createPool({
    host: dbHost,
    port: Number(process.env.DB_PORT || 3306),
    user: dbUser,
    password: dbPassword,
    database: dbName,
    ssl,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

ensureDatabase().catch((error) => {
    console.warn("Database initialization warning:", error.message);
});

module.exports = pool;
