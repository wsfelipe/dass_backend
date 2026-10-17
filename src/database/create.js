const fs = require('node:fs');
const path = require('node:path');
const db = require('../config/db');

async function create() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(schema);
    console.log('Schema do banco aplicado com sucesso.');
  } catch (error) {
    console.error(`Falha ao aplicar schema: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

create();