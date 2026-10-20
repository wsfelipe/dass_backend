const HttpError = require('../utils/HttpError');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, errors: err.errors });
  }

  if (err.name === 'ValidationError' || (err.details && Array.isArray(err.details))) {
    const errors = err.details && Array.isArray(err.details)
      ? err.details.map((d) => ({
          field: d.path ? d.path.join('.') : 'query',
          message: d.message || err.message || 'Dados inválidos',
        }))
      : [{ field: 'query', message: err.message || 'Dados inválidos' }];
    return res.status(422).json({ message: err.message || 'Dados inválidos', errors });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido no corpo da requisição' });
  }

  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor' });
};
