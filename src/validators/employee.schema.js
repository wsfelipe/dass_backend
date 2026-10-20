const Joi = require('joi');
const { onlyDigits, isValidCpf } = require('./cpf');

const SHIRT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
const SHOE_MIN = 34;
const SHOE_MAX = 48;

const shirtSizeItem = Joi.string()
  .trim()
  .uppercase()
  .valid(...SHIRT_SIZES)
  .messages({
    'string.base': 'Tamanho de camiseta inválido',
    'any.only': `Tamanho de camiseta inválido. Use: ${SHIRT_SIZES.join(', ')}`,
  });

const shirtSize = Joi.string()
  .trim()
  .uppercase()
  .valid(...SHIRT_SIZES)
  .required()
  .messages({
    'any.required': 'Tamanho de camiseta é obrigatório',
    'string.base': 'Tamanho de camiseta inválido',
    'any.only': `Tamanho de camiseta inválido. Use: ${SHIRT_SIZES.join(', ')}`,
  });

const shoeSize = Joi.number()
  .integer()
  .min(SHOE_MIN)
  .max(SHOE_MAX)
  .required()
  .messages({
    'number.base': 'Tamanho de calçado deve ser um número',
    'number.integer': 'Tamanho de calçado deve ser um número inteiro',
    'number.min': `Tamanho de calçado deve ser entre ${SHOE_MIN} e ${SHOE_MAX}`,
    'number.max': `Tamanho de calçado deve ser entre ${SHOE_MIN} e ${SHOE_MAX}`,
    'any.required': 'Tamanho de calçado é obrigatório',
  });

const employeeBodySchema = Joi.object({
  cpf: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!isValidCpf(value)) return helpers.error('cpf.invalid');
      return onlyDigits(value);
    })
    .required()
    .messages({
      'string.base': 'CPF inválido',
      'any.required': 'CPF é obrigatório',
      'cpf.invalid': 'CPF inválido',
    }),
  name: Joi.string()
    .trim()
    .min(3)
    .max(120)
    .required()
    .messages({
      'string.base': 'Nome inválido',
      'string.min': 'Nome deve ter pelo menos 3 caracteres',
      'string.max': 'Nome deve ter no máximo 120 caracteres',
      'any.required': 'Nome é obrigatório',
    }),
  email: Joi.string()
    .trim()
    .email({ tlds: false })
    .max(160)
    .required()
    .lowercase()
    .messages({
      'string.base': 'E-mail inválido',
      'string.email': 'E-mail inválido',
      'string.max': 'E-mail deve ter no máximo 160 caracteres',
      'any.required': 'E-mail é obrigatório',
    }),
  shirtSize,
  shoeSize,
});

const ALLOWED_SORT_COLUMNS = ['cpf', 'name', 'email', 'shirtSize', 'shoeSize'];

const listQuerySchema = Joi.object({
  cpf: Joi.string().trim().optional().allow(''),
  name: Joi.string().trim().optional().allow(''),
  email: Joi.string().trim().optional().allow(''),
  search: Joi.string().trim().optional().allow(''),
  shirtSize: Joi.alternatives().try(
    shirtSize.optional(),
    Joi.array().items(shirtSizeItem).min(1)
  ),
  shoeSize: Joi.alternatives().try(
    shoeSize.optional(),
    Joi.array().items(Joi.number().integer().min(SHOE_MIN).max(SHOE_MAX)).min(1)
  ),
  sort: Joi.string().trim().valid(...ALLOWED_SORT_COLUMNS).optional()
    .messages({
      'any.only': 'Coluna de ordenação inválida',
    }),
  order: Joi.string().trim().valid('asc', 'desc').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
}).unknown(false)
  .custom((value, helpers) => {
    if (value.order && !value.sort) {
      return helpers.error('order.requiresSort', { message: 'Necessário informar campo de ordenação (sort)' });
    }
    return value;
  })
  .messages({
    'order.requiresSort': 'Necessário informar campo de ordenação (sort)',
  });

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'ID inválido',
      'number.integer': 'ID inválido',
      'number.positive': 'ID inválido',
      'any.required': 'ID é obrigatório',
    }),
});

function withoutEmptyValues(value) {
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== '')
  );
}

const listQuerySchemaProcessed = Joi.object({
  cpf: Joi.string().trim().optional().allow(''),
  name: Joi.string().trim().optional().allow(''),
  email: Joi.string().trim().optional().allow(''),
  search: Joi.string().trim().optional().allow(''),
  shirtSize: Joi.alternatives().try(
    shirtSize.optional(),
    Joi.array().items(shirtSizeItem).min(1)
  ),
  shoeSize: Joi.alternatives().try(
    shoeSize.optional(),
    Joi.array().items(Joi.number().integer().min(SHOE_MIN).max(SHOE_MAX)).min(1)
  ),
  sort: Joi.string().trim().valid(...ALLOWED_SORT_COLUMNS).optional()
    .messages({
      'any.only': 'Coluna de ordenação inválida',
    }),
  order: Joi.string().trim().valid('asc', 'desc').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
}).unknown(false)
  .custom((value, helpers) => {
    if (value.order && !value.sort) {
      return helpers.error('order.requiresSort', { message: 'Necessário informar campo de ordenação (sort)' });
    }
    return value;
  })
  .messages({
    'order.requiresSort': 'Necessário informar campo de ordenação (sort)',
  });

function parseQueryArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return value;
}

function normalizeQuery(query) {
  const cleaned = withoutEmptyValues(query);
  const normalized = { ...cleaned };
  if (normalized.shirtSize !== undefined) normalized.shirtSize = parseQueryArray(normalized.shirtSize);
  if (normalized.shoeSize !== undefined) normalized.shoeSize = parseQueryArray(normalized.shoeSize);
  return Joi.attempt(normalized, listQuerySchemaProcessed);
}

module.exports = {
  SHIRT_SIZES,
  ALLOWED_SORT_COLUMNS,
  employeeBodySchema,
  listQuerySchema: {
    validate: (data) => {
      const cleaned = withoutEmptyValues(data);
      const normalized = { ...cleaned };
      if (normalized.shirtSize !== undefined) normalized.shirtSize = parseQueryArray(normalized.shirtSize);
      if (normalized.shoeSize !== undefined) normalized.shoeSize = parseQueryArray(normalized.shoeSize);
      return Joi.attempt(normalized, listQuerySchemaProcessed);
    },
    safeParse: (data) => {
      try {
        const result = normalizeQuery(data);
        return { success: true, data: result };
      } catch (e) {
        return { success: false, error: e };
      }
    },
  },
  idParamSchema,
};
