// Express 4 não captura erro de função async sozinho, então repassamos pro next()
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
