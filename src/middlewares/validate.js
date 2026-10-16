const HttpError = require('../utils/HttpError');

function validate(schemaOrObject, source = 'body') {
  return (req, res, next) => {
    // Joi schema (employeeBodySchema, idParamSchema) or listQuerySchema object
    const isSchema = typeof schemaOrObject.validate === 'function';
    const hasSafeParse = typeof schemaOrObject.safeParse === 'function';

    let result;
    if (isSchema) {
      // Direct Joi schema
      const { error, value } = schemaOrObject.validate(req[source], { allowUnknown: false });
      if (error) {
        const errors = error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        }));
        return next(new HttpError(422, 'Dados inválidos', errors));
      }
      result = value;
    } else if (hasSafeParse) {
      // listQuerySchema with safeParse wrapper
      const parsed = schemaOrObject.safeParse(req[source]);
      if (!parsed.success) {
        const err = parsed.error;
        // Joi validation errors are in err.message, but for list queries we handle manually
        const errors = [{ field: 'query', message: err.message || 'Dados inválidos' }];
        return next(new HttpError(422, 'Dados inválidos', errors));
      }
      result = parsed.data;
    } else {
      return next(new HttpError(500, 'Schema de validação inválida'));
    }

    req.valid = { ...req.valid, [source]: result };
    next();
  };
}

module.exports = validate;
