import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js"; // Assuming you have this utility

export const protectedRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      // Use AppError for consistent error handling
      return next(new AppError("Unauthorized - No Token Provided", 401));
    }

    // Wrap jwt.verify in a try-catch for specific JWT errors
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    req.user = user;
    next();
  } catch (error) {
    // Catch specific JWT errors for more descriptive feedback
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Unauthorized - Token Expired", 401));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Unauthorized - Invalid Token", 401));
    }

    console.error("Error in protectedRoute middleware:", error.message);
    return next(new AppError("Internal server error", 500));
  }
};
