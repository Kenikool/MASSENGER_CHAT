import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";

export const generateToken = async (userId, res, req = null) => {
  const jwtSecret =
    process.env.JWT_SECRET || "fallback_secret_key_for_development";
  const jwtExpired = process.env.JWT_EXPIRED || "7d";
  const cookieExpiresIn = process.env.JWT_COOKIE_EXPIRES_IN || 7;

  const token = jwt.sign({ userId }, jwtSecret, {
    expiresIn: jwtExpired,
  });

  const cookieExpiration = cookieExpiresIn * 24 * 60 * 60 * 1000; // Convert days to MS

  res.cookie("jwt", token, {
    httpOnly: true, //prevent XSS attacks cross-site scripting attacks
    secure: process.env.NODE_ENV === "production", // Set secure to true only in production
    sameSite: "lax", // Use 'lax' for better compatibility during redirects
    maxAge: cookieExpiration,
  });

  // Save session details to the user document if req is provided
  if (req) {
    const user = await User.findById(userId);
    if (user) {
      const parser = new UAParser(req.headers["user-agent"]);
      const ua = parser.getResult();
      const userAgent = `${ua.browser.name || "Unknown Browser"} on ${
        ua.os.name || "Unknown OS"
      }`;

      user.sessions.push({
        token: token,
        createdAt: new Date(),
        userAgent: userAgent,
      });
      await user.save();
    }
  }
  return token;
};
