class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // lista opcional de { field, message }
  }
}

module.exports = HttpError;
