const { z } = require('zod');
const { onlyDigits, isValidCpf } = require('./cpf');

const SHIRT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
const SHOE_MIN = 34;
const SHOE_MAX = 48;

const shirtSize = z
  .string({
    required_error: 'Tamanho de camiseta é obrigatório',
    invalid_type_error: 'Tamanho de camiseta inválido',
  })
  .trim()
  .toUpperCase()
  .pipe(
    z.enum(SHIRT_SIZES, {
      errorMap: () => ({ message: `Tamanho de camiseta inválido. Use: ${SHIRT_SIZES.join(', ')}` }),
    })
  );

const shoeSize = z.coerce
  .number({ invalid_type_error: 'Tamanho de calçado deve ser um número' })
  .int('Tamanho de calçado deve ser um número inteiro')
  .min(SHOE_MIN, `Tamanho de calçado deve ser entre ${SHOE_MIN} e ${SHOE_MAX}`)
  .max(SHOE_MAX, `Tamanho de calçado deve ser entre ${SHOE_MIN} e ${SHOE_MAX}`);

const employeeBodySchema = z.object({
  cpf: z
    .string({ required_error: 'CPF é obrigatório', invalid_type_error: 'CPF inválido' })
    .trim()
    .refine(isValidCpf, 'CPF inválido')
    .transform(onlyDigits),
  name: z
    .string({ required_error: 'Nome é obrigatório', invalid_type_error: 'Nome inválido' })
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(120, 'Nome deve ter no máximo 120 caracteres'),
  email: z
    .string({ required_error: 'E-mail é obrigatório', invalid_type_error: 'E-mail inválido' })
    .trim()
    .toLowerCase()
    .email('E-mail inválido')
    .max(160, 'E-mail deve ter no máximo 160 caracteres'),
  shirtSize,
  shoeSize,
});

// O front pode mandar filtros vazios (?name=&email=...), então descartamos antes de validar
const withoutEmptyValues = (value) => {
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== ''));
};

const listQuerySchema = z.preprocess(
  withoutEmptyValues,
  z.object({
    cpf: z.string().trim().optional(),
    name: z.string().trim().optional(),
    email: z.string().trim().optional(),
    search: z.string().trim().optional(),
    shirtSize: shirtSize.optional(),
    shoeSize: shoeSize.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
);

const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'ID inválido' })
    .int('ID inválido')
    .positive('ID inválido'),
});

module.exports = { SHIRT_SIZES, employeeBodySchema, listQuerySchema, idParamSchema };
