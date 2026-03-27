import session from "express-session";
import MySQLStore from "express-mysql-session";
import dotenv from "dotenv";

dotenv.config();

const MySQLStoreSession = MySQLStore(session);

const sessionStore = new MySQLStoreSession({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8,
    secure: false,
    httpOnly: true,
  },
});

export default sessionMiddleware;
