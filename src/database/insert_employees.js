const db = require('../config/db');

const employees = [
  { cpf: '48407747572', name: 'Ana Beatriz Silva', email: 'anabeatriz.484@teste.com', shirt_size_id: 4, shoe_size_id: 5 },
  { cpf: '89048744911', name: 'Bruno Carlos Pereira', email: 'brunocarlo.890@teste.com', shirt_size_id: 4, shoe_size_id: 15 },
  { cpf: '34883069257', name: 'Camila Fernanda Lima', email: 'camilafern.348@teste.com', shirt_size_id: 3, shoe_size_id: 9 },
  { cpf: '14846201600', name: 'Daniel Henrique Souza', email: 'danielhenr.148@teste.com', shirt_size_id: 1, shoe_size_id: 5 },
  { cpf: '32995790967', name: 'Eduardo Augusto Oliveira', email: 'eduardoaug.329@teste.com', shirt_size_id: 4, shoe_size_id: 2 },
  { cpf: '24944065876', name: 'Fernanda Luiza Costa', email: 'fernandalu.249@teste.com', shirt_size_id: 3, shoe_size_id: 8 },
  { cpf: '01092388346', name: 'Gabriel Ricardo Almeida', email: 'gabrielric.010@teste.com', shirt_size_id: 2, shoe_size_id: 7 },
  { cpf: '51135610029', name: 'Helena Mariana Martins', email: 'helenamari.511@teste.com', shirt_size_id: 6, shoe_size_id: 7 },
  { cpf: '43847335260', name: 'Igor Felipe Ribeiro', email: 'igorfelipe.438@teste.com', shirt_size_id: 2, shoe_size_id: 8 },
  { cpf: '08546951683', name: 'Julia Carolina Lopes', email: 'juliacarol.085@teste.com', shirt_size_id: 3, shoe_size_id: 11 },
  { cpf: '30007811969', name: 'Kaio Eduardo Dias', email: 'kaioeduard.300@teste.com', shirt_size_id: 3, shoe_size_id: 6 },
  { cpf: '30294097678', name: 'Larissa Fernanda Cardoso', email: 'larissafer.302@teste.com', shirt_size_id: 1, shoe_size_id: 11 },
  { cpf: '03982383919', name: 'Mateus Gustavo Barbosa', email: 'mateusgust.039@teste.com', shirt_size_id: 1, shoe_size_id: 12 },
  { cpf: '49978518096', name: 'Nathalia Beatriz Ferreira', email: 'nathaliabe.499@teste.com', shirt_size_id: 5, shoe_size_id: 15 },
  { cpf: '03691860877', name: 'Otavio Henrique Santos', email: 'otaviohenr.036@teste.com', shirt_size_id: 4, shoe_size_id: 8 },
  { cpf: '43783887828', name: 'Paula Cristina Rocha', email: 'paulacrist.437@teste.com', shirt_size_id: 1, shoe_size_id: 7 },
  { cpf: '91246219948', name: 'Quero Cesar Miranda', email: 'querocesar.912@teste.com', shirt_size_id: 1, shoe_size_id: 9 },
  { cpf: '82271176000', name: 'Rafael Antonio Nunes', email: 'rafaelanto.822@teste.com', shirt_size_id: 4, shoe_size_id: 4 },
  { cpf: '45048688570', name: 'Sofia Juliana Andrade', email: 'sofiajulia.450@teste.com', shirt_size_id: 6, shoe_size_id: 4 },
  { cpf: '71038178045', name: 'Thiago Leonardo Vasconcelos', email: 'thiagoleon.710@teste.com', shirt_size_id: 1, shoe_size_id: 7 },
];

async function run() {
  try {
    for (const e of employees) {
      await db.query(
        'INSERT INTO employees (cpf, name, email, shirt_size_id, shoe_size_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (cpf) DO NOTHING',
        [e.cpf, e.name, e.email, e.shirt_size_id, e.shoe_size_id]
      );
    }
    console.log('Inseridos/atualizados 20 funcionários fictícios (CPFs válidos).');
  } catch (err) {
    console.error('Erro ao inserir:', err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

run();
