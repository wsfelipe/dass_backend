const db = require('../config/db');
const HttpError = require('../utils/HttpError');
const { onlyDigits } = require('../validators/cpf');

// banco usa snake_case, a API devolve camelCase
function toDto(row) {
  return {
    id: row.id,
    cpf: row.cpf,
    name: row.name,
    email: row.email,
    shirtSize: row.shirt_size,
    shoeSize: row.shoe_size,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(data) {
  return {
    cpf: data.cpf,
    name: data.name,
    email: data.email,
    shirt_size: data.shirtSize,
    shoe_size: data.shoeSize,
  };
}

// Evita que % e _ digitados na busca virem curinga do LIKE
function escapeLike(term) {
  return term.replace(/[\\%_]/g, '\\$&');
}

function buildFilters({ cpf, name, email, shirtSize, shoeSize, search }) {
  const conditions = [];
  const values = [];
  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    const searchPlaceholder = addValue(pattern);
    const searchConditions = [
      `name ILIKE ${searchPlaceholder}`,
      `email ILIKE ${searchPlaceholder}`,
    ];
    const digits = onlyDigits(search);
    if (digits) searchConditions.push(`cpf LIKE ${addValue(`%${digits}%`)}`);
    conditions.push(`(${searchConditions.join(' OR ')})`);
  }
  if (cpf) {
    const digits = onlyDigits(cpf);
    conditions.push(digits ? `cpf LIKE ${addValue(`%${digits}%`)}` : 'FALSE');
  }
  if (name) conditions.push(`name ILIKE ${addValue(`%${escapeLike(name)}%`)}`);
  if (email) conditions.push(`email ILIKE ${addValue(`%${escapeLike(email)}%`)}`);
  if (shirtSize) conditions.push(`shirt_size = ${addValue(shirtSize)}`);
  if (shoeSize !== undefined) conditions.push(`shoe_size = ${addValue(shoeSize)}`);

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

// 23505 = unique_violation no Postgres
function translateDbError(err) {
  if (err.code !== '23505') return err;

  const constraint = err.constraint || '';

  if (constraint.includes('cpf')) {
    return new HttpError(409, 'CPF já cadastrado', [
      { field: 'cpf', message: 'Já existe um funcionário com este CPF' },
    ]);
  }
  if (constraint.includes('email')) {
    return new HttpError(409, 'E-mail já cadastrado', [
      { field: 'email', message: 'Já existe um funcionário com este e-mail' },
    ]);
  }
  return new HttpError(409, 'Registro duplicado');
}

async function list(filters) {
  const { page, limit } = filters;
  const { where, values } = buildFilters(filters);

  const [countResult, rows] = await Promise.all([
    db.query(`SELECT COUNT(*) AS count FROM employees ${where}`, values),
    db.query(
      `SELECT * FROM employees ${where} ORDER BY name, id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, (page - 1) * limit]
    ),
  ]);

  const total = Number(countResult.rows[0].count);

  return {
    data: rows.rows.map(toDto),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getById(id) {
  const result = await db.query('SELECT * FROM employees WHERE id = $1', [id]);
  const row = result.rows[0];
  if (!row) throw new HttpError(404, 'Funcionário não encontrado');
  return toDto(row);
}

async function create(data) {
  try {
    const employee = toRow(data);
    const result = await db.query(
      `INSERT INTO employees (cpf, name, email, shirt_size, shoe_size)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [employee.cpf, employee.name, employee.email, employee.shirt_size, employee.shoe_size]
    );
    const [row] = result.rows;
    return toDto(row);
  } catch (err) {
    throw translateDbError(err);
  }
}

async function update(id, data) {
  try {
    const employee = toRow(data);
    const result = await db.query(
      `UPDATE employees
       SET cpf = $1, name = $2, email = $3, shirt_size = $4, shoe_size = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [employee.cpf, employee.name, employee.email, employee.shirt_size, employee.shoe_size, id]
    );
    const [row] = result.rows;

    if (!row) throw new HttpError(404, 'Funcionário não encontrado');
    return toDto(row);
  } catch (err) {
    throw translateDbError(err);
  }
}

async function remove(id) {
  const result = await db.query('DELETE FROM employees WHERE id = $1', [id]);
  if (!result.rowCount) throw new HttpError(404, 'Funcionário não encontrado');
}

module.exports = { list, getById, create, update, remove };
