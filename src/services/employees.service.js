const db = require('../config/db');
const HttpError = require('../utils/HttpError');
const { onlyDigits } = require('../validators/cpf');

function toDto(row) {
  return {
    id: row.id,
    cpf: row.cpf,
    name: row.name,
    email: row.email,
    shirtSize: row.shirt_size_code,
    shoeSize: row.shoe_size_size ? Number(row.shoe_size_size) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function escapeLike(term) {
  return term.replace(/[\\%_]/g, '\\$&');
}

function parseArrayParam(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    if (value.trim().startsWith('[') && value.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [value];
  }
  return value ? [value] : value;
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
      `e.name ILIKE ${searchPlaceholder}`,
      `e.email ILIKE ${searchPlaceholder}`,
    ];
    const digits = onlyDigits(search);
    if (digits) searchConditions.push(`e.cpf LIKE ${addValue(`%${digits}%`)}`);
    conditions.push(`(${searchConditions.join(' OR ')})`);
  }
  if (cpf) {
    const digits = onlyDigits(cpf);
    conditions.push(digits ? `e.cpf LIKE ${addValue(`%${digits}%`)}` : 'FALSE');
  }
  if (name) conditions.push(`e.name ILIKE ${addValue(`%${escapeLike(name)}%`)}`);
  if (email) conditions.push(`e.email ILIKE ${addValue(`%${escapeLike(email)}%`)}`);
  if (shirtSize) {
    const sizes = parseArrayParam(shirtSize);
    const placeholders = sizes.map((s) => addValue(s)).join(',');
    conditions.push(`ss.code IN (${placeholders})`);
  }
  if (shoeSize !== undefined && shoeSize !== null && shoeSize !== '') {
    const sizes = parseArrayParam(shoeSize);
    const placeholders = sizes.map((s) => addValue(s)).join(',');
    conditions.push(`sh.size IN (${placeholders})`);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

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

async function getShirtSizeId(code) {
  const res = await db.query('SELECT id FROM shirt_sizes WHERE code = $1', [code]);
  if (!res.rows.length) throw new HttpError(400, 'Tamanho de camiseta inválido');
  return res.rows[0].id;
}

async function getShoeSizeId(size) {
  const res = await db.query('SELECT id FROM shoe_sizes WHERE size = $1', [size]);
  if (!res.rows.length) throw new HttpError(400, 'Tamanho de calçado inválido');
  return res.rows[0].id;
}

async function list(filters) {
  if (!filters || typeof filters !== 'object') filters = {};
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const { page: _p, limit: _l, sort, order, ...rest } = filters;
  const { where, values } = buildFilters(rest);

  const baseQuery = `
    FROM employees e
    JOIN shirt_sizes ss ON e.shirt_size_id = ss.id
    JOIN shoe_sizes sh ON e.shoe_size_id = sh.id
  `;

  let orderByClause = 'ORDER BY e.name, e.id';
  if (sort) {
    const allowed = ['cpf', 'name', 'email', 'shirtSize', 'shoeSize'];
    if (!allowed.includes(sort)) {
      throw new HttpError(422, 'Dados inválidos', [{ field: 'sort', message: 'Coluna de ordenação inválida. Use: cpf, name, email, shirtSize, shoeSize' }]);
    }
    const sortColumn = sort === 'shirtSize' ? 'ss."order"' : sort === 'shoeSize' ? 'sh."order"' : `e.${sort}`;
    const sortOrder = (order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    orderByClause = `ORDER BY ${sortColumn} ${sortOrder}, e.id ASC`;
  }

  const countSql = `SELECT COUNT(*) AS count ${baseQuery} ${where}`;
  const listSql = `SELECT e.*, ss.code AS shirt_size_code, sh.size AS shoe_size_size ${baseQuery} ${where} ${orderByClause} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

  const [countResult, rows] = await Promise.all([
    db.query(countSql, values),
    db.query(listSql, [...values, limit, (page - 1) * limit]),
  ]);

  const total = Number(countResult.rows[0].count);
  return {
    data: rows.rows.map(toDto),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getById(id) {
  const result = await db.query(`
    SELECT e.*, ss.code AS shirt_size_code, sh.size AS shoe_size_size
    FROM employees e
    JOIN shirt_sizes ss ON e.shirt_size_id = ss.id
    JOIN shoe_sizes sh ON e.shoe_size_id = sh.id
    WHERE e.id = $1`, [id]);
  const row = result.rows[0];
  if (!row) throw new HttpError(404, 'Funcionário não encontrado');
  return toDto(row);
}

async function create(data) {
  try {
    const shirtSizeId = await getShirtSizeId(data.shirtSize);
    const shoeSizeId = await getShoeSizeId(data.shoeSize);
    const result = await db.query(
      `INSERT INTO employees (cpf, name, email, shirt_size_id, shoe_size_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.cpf, data.name, data.email, shirtSizeId, shoeSizeId]
    );
    const row = result.rows[0];
    const full = await db.query(`
      SELECT e.*, ss.code AS shirt_size_code, sh.size AS shoe_size_size
      FROM employees e
      JOIN shirt_sizes ss ON e.shirt_size_id = ss.id
      JOIN shoe_sizes sh ON e.shoe_size_id = sh.id
      WHERE e.id = $1`, [row.id]);
    return toDto(full.rows[0]);
  } catch (err) {
    throw translateDbError(err);
  }
}

async function update(id, data) {
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.cpf !== undefined) { fields.push(`cpf = $${idx++}`); values.push(data.cpf); }
    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email); }
    if (data.shirtSize !== undefined) {
      const sid = await getShirtSizeId(data.shirtSize);
      fields.push(`shirt_size_id = $${idx++}`); values.push(sid);
    }
    if (data.shoeSize !== undefined) {
      const sid = await getShoeSizeId(data.shoeSize);
      fields.push(`shoe_size_id = $${idx++}`); values.push(sid);
    }
    fields.push(`updated_at = NOW()`);

    values.push(id);
    const result = await db.query(
      `UPDATE employees SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    const row = result.rows[0];
    if (!row) throw new HttpError(404, 'Funcionário não encontrado');
    const full = await db.query(`
      SELECT e.*, ss.code AS shirt_size_code, sh.size AS shoe_size_size
      FROM employees e
      JOIN shirt_sizes ss ON e.shirt_size_id = ss.id
      JOIN shoe_sizes sh ON e.shoe_size_id = sh.id
      WHERE e.id = $1`, [row.id]);
    return toDto(full.rows[0]);
  } catch (err) {
    throw translateDbError(err);
  }
}

async function remove(id) {
  const result = await db.query('DELETE FROM employees WHERE id = $1', [id]);
  if (!result.rowCount) throw new HttpError(404, 'Funcionário não encontrado');
}

module.exports = { list, getById, create, update, remove };
