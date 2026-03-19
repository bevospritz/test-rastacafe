import mysql from 'mysql2/promise';
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.MYSQL_PSW,
    database: 'rastacafetest'
  });
  
  try {
    await connection.connect();
    console.log('Connected to MySQL as id ' + connection.threadId);
  } catch (err) {
    console.error('Error connecting to MySQL:', err.stack);
  }
  

export default connection;