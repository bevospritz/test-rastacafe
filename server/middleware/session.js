import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import pool from "../db.js";

const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore(
  {
    clearExpired: true,
    checkExpirationInterval: 900000, // check every 15 min
    expiration: 28800000,            // match cookie maxAge: 8 hours
    createDatabaseTable: true,
  },
  pool,
);

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
    secure: false,
    httpOnly: true,
  },
});

export default sessionMiddleware;
