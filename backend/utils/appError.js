class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // Set status based on the status code. 'fail' for 4xx, 'error' for 5xx.
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    // Mark this error as an operational, trusted error.
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor call from it.
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
