const HttpError = require('../utils/HttpError');

// source: 'body' | 'query' | 'params'
// O resultado já tratado fica em req.valid[source]
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new HttpError(422, 'Dados inválidos', errors));
    }

    req.valid = { ...req.valid, [source]: result.data };
    next();
  };
}

module.exports = validate;
