import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
  maxAge: 1000 * 60 * 60 * 8, // 8 ore
  secure: false, 
  httpOnly: true 
}
});

export default sessionMiddleware;
