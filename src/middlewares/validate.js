const HttpError = require('../utils/HttpError');

function validate(schemaOrObject, source = 'body') {
  return (req, res, next) => {
    const isSchema = typeof schemaOrObject.validate === 'function';
    const hasSafeParse = typeof schemaOrObject.safeParse === 'function';

    let result;
    if (isSchema) {
      let validationResult;
      try {
        validationResult = schemaOrObject.validate(req[source], { allowUnknown: false });
      } catch (e) {
        validationResult = { error: e };
      }
      const { error, value } = validationResult;
      if (error) {
        const errors = error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        }));
        return next(new HttpError(422, 'Dados inválidos', errors));
      }
      result = value;
    } else if (hasSafeParse) {
      const parsed = schemaOrObject.safeParse(req[source]);
      if (!parsed.success) {
        const err = parsed.error;
        let errors;
        if (err.details && Array.isArray(err.details)) {
          errors = err.details.map((d) => {
            const field = d.path ? d.path.join('.') : 'query';
            let message = d.message || err.message || 'Dados inválidos';
            if (field.startsWith('shirtSize.') && message.includes('must be one of')) {
              message = 'Tamanho de camiseta inválido. Use: PP, P, M, G, GG, XG';
            }
            if (field.startsWith('shoeSize.') && message.includes('must be one of')) {
              message = 'Tamanho de calçado deve ser entre 34 e 48';
            }
            return { field, message };
          });
        } else {
          errors = [{ field: 'query', message: err.message || 'Dados inválidos' }];
        }
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
