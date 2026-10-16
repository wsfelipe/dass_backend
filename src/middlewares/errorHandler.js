const HttpError = require('../utils/HttpError');

// O Express só reconhece como handler de erro se a função tiver 4 parâmetros
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, errors: err.errors });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido no corpo da requisição' });
  }

  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor' });
};
