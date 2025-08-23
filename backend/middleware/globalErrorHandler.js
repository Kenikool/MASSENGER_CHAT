import AppError from "../utils/appError.js";

// Handles Mongoose CastError: e.g., an invalid MongoDB ID format.
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400); // 400 for Bad Request
};

// Handles Mongoose Duplicate Field Error: e.g., a unique field value is repeated.
const handleDuplicateFieldsDB = (err) => {
  // Extract the duplicate value from the error message
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Handles Mongoose Validation Error: e.g., required field is missing.
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

// Handles JWT Invalid Signature Error
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401); // 401 for Unauthorized

// Handles JWT Expired Error
const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

// Send detailed error during development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Send generic, user-friendly error in production
const sendErrorProd = (err, res) => {
  // A) For operational, trusted errors: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // B) For programming or other unknown errors: don't leak error details
  } else {
    // 1) Log error to the console for the developer
    console.error("ERROR 💥", err);
    // 2) Send generic message
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

export default (err, req, res, next) => {
  // Set default status code and status if not defined
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    // Create a hard copy of the error object
    let error = {
      ...err,
      name: err.name,
      message: err.message,
      errmsg: err.errmsg,
    };

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
