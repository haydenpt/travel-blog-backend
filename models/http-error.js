class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); // Send message to Error
    this.code = errorCode;
  }
}

module.exports = HttpError;
