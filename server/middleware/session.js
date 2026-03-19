import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000, secure: false, httpOnly: true }, // Imposta secure: true in produzione con HTTPS
});

export default sessionMiddleware;
