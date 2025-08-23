import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("jwt", token, {
    httpOnly: true, //prevent XSS attacks cross-site scripting attacks
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict", //prevent CSRF attacks cross-site request forgery attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, //MS
  });
  return token;
};
