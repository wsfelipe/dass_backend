const Joi = require('joi');
const { onlyDigits, isValidCpf } = require('./cpf');

const SHIRT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
const SHOE_MIN = 34;
const SHOE_MAX = 48;

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

const listQuerySchema = Joi.object({
  cpf: Joi.string().trim().optional().allow(''),
  name: Joi.string().trim().optional().allow(''),
  email: Joi.string().trim().optional().allow(''),
  search: Joi.string().trim().optional().allow(''),
  shirtSize: shirtSize.optional(),
  shoeSize: shoeSize.optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
}).unknown(false);

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
  shirtSize: shirtSize.optional(),
  shoeSize: shoeSize.optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
}).unknown(false);

function normalizeQuery(query) {
  const cleaned = withoutEmptyValues(query);
  return Joi.attempt(cleaned, listQuerySchemaProcessed);
}

module.exports = {
  SHIRT_SIZES,
  employeeBodySchema,
  listQuerySchema: {
    validate: (data) => normalizeQuery(data),
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
