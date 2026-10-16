const env = require('./config/env');
const app = require('./app');
const db = require('./config/db');

const server = app.listen(env.port, () => {
  console.log(`API rodando na porta ${env.port} (${env.nodeEnv})`);
});

function shutdown(signal) {
  console.log(`${signal} recebido, encerrando...`);
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
