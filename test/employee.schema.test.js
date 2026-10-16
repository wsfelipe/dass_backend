const test = require('node:test');
const assert = require('node:assert/strict');
process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/dass_brindes';
const db = require('../src/config/db');
const employeeService = require('../src/services/employees.service');
const { employeeBodySchema, listQuerySchema } = require('../src/validators/employee.schema');

const validEmployee = {
  cpf: '529.982.247-25',
  name: '  Maria da Silva  ',
  email: ' MARIA@EXAMPLE.COM ',
  shirtSize: 'm',
  shoeSize: '38',
};

function parseEmployee(data) {
  return employeeBodySchema.validate(data).value;
}

function safeParseEmployee(data) {
  const result = employeeBodySchema.validate(data);
  return !result.error ? { success: true, data: result.value } : { success: false, error: result.error };
}

function parseListQuery(data) {
  return listQuerySchema.validate ? listQuerySchema.validate(data) : listQuerySchema.safeParse(data);
}

test('normaliza os dados válidos do funcionário', () => {
  const result = parseEmployee(validEmployee);
  assert.deepEqual(result, {
    cpf: '52998224725',
    name: 'Maria da Silva',
    email: 'maria@example.com',
    shirtSize: 'M',
    shoeSize: 38,
  });
});

test('rejeita CPF inválido e tamanhos fora das opções permitidas', () => {
  assert.equal(safeParseEmployee({ ...validEmployee, cpf: '111.111.111-11' }).success, false);
  assert.equal(safeParseEmployee({ ...validEmployee, shirtSize: 'XXL' }).success, false);
  assert.equal(safeParseEmployee({ ...validEmployee, shoeSize: 49 }).success, false);
});

test('aplica paginação padrão e aceita os filtros de pesquisa', () => {
  const result = parseListQuery({ search: 'maria', shirtSize: 'g', shoeSize: '40', name: '' });
  assert.deepEqual(result.value || result.data || result, {
    search: 'maria',
    shirtSize: 'G',
    shoeSize: 40,
    page: 1,
    limit: 10,
  });
});

test('monta a pesquisa SQL com valores parametrizados e paginação', async () => {
  const originalQuery = db.query;
  const calls = [];
  db.query = async (sql, values) => {
    calls.push({ sql, values });
    if (sql.startsWith('SELECT COUNT')) return { rows: [{ count: '1' }] };
    return {
      rows: [{
        id: 1,
        cpf: '52998224725',
        name: 'Maria da Silva',
        email: 'maria@example.com',
        shirt_size: 'M',
        shoe_size: 38,
      }],
    };
  };

  try {
    const result = await employeeService.list({ search: 'Maria', page: 2, limit: 5 });
    assert.equal(result.meta.total, 1);
    assert.equal(result.meta.totalPages, 1);
    assert.equal(result.data[0].shirtSize, 'M');
    assert.match(calls[0].sql, /name ILIKE \$1/);
    assert.match(calls[0].sql, /email ILIKE \$1/);
    assert.deepEqual(calls[0].values, ['%Maria%']);
    assert.deepEqual(calls[1].values, ['%Maria%', 5, 5]);
    assert.doesNotMatch(calls[0].sql, /Maria/);
  } finally {
    db.query = originalQuery;
    await db.end();
  }
});
