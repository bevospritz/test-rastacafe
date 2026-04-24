import "./env.js";
import mysql from 'mysql2/promise';
import dotenv from "dotenv";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

try {
  await connection.connect();
  console.log('Connected to MySQL as id ' + connection.threadId);
} catch (err) {
  console.error('Error connecting to MySQL:', err.stack);
}

export default connection;