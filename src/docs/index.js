const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
};

const errorResponse = {
  description: 'Erro na requisição',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          errors: { type: 'array', items: { type: 'object' } },
        },
      },
    },
  },
};

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Dass Funcionários API',
    version: '1.0.0',
    description: 'Cadastro e consulta de tamanhos de camiseta e calçado dos funcionários.',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Funcionários' }, { name: 'Saúde' }],
  paths: {
    '/health': {
      get: {
        tags: ['Saúde'],
        summary: 'Verifica a API e a conexão com o banco',
        responses: { 200: { description: 'Serviço disponível' }, 503: { description: 'Banco indisponível' } },
      },
    },
    '/employees': {
      get: {
        tags: ['Funcionários'],
        summary: 'Lista funcionários com pesquisa e paginação',
        parameters: [
          ...['search', 'cpf', 'name', 'email'].map((name) => ({
            name,
            in: 'query',
            schema: { type: 'string' },
          })),
          { name: 'shirtSize', in: 'query', schema: { type: 'string', description: 'JSON array: ["P","M","G"]' } },
          { name: 'shoeSize', in: 'query', schema: { type: 'string', description: 'JSON array: [40,42]' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
        ],
        responses: {
          200: {
            description: 'Página de funcionários',
            content: { 'application/json': { schema: { type: 'object', properties: {
              data: { type: 'array', items: { type: 'object' } },
              meta: { type: 'object' },
            } } } },
          },
          422: errorResponse,
        },
      },
      post: {
        tags: ['Funcionários'],
        summary: 'Cadastra funcionário',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { 201: { description: 'Funcionário cadastrado' }, 409: errorResponse, 422: errorResponse },
      },
    },
    '/employees/{id}': {
      parameters: [idParameter],
      get: {
        tags: ['Funcionários'],
        summary: 'Busca funcionário por ID',
        responses: { 200: { description: 'Funcionário encontrado' }, 404: errorResponse },
      },
      put: {
        tags: ['Funcionários'],
        summary: 'Atualiza funcionário',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { 200: { description: 'Funcionário atualizado' }, 404: errorResponse, 409: errorResponse, 422: errorResponse },
      },
      delete: {
        tags: ['Funcionários'],
        summary: 'Exclui funcionário',
        responses: { 204: { description: 'Funcionário excluído' }, 404: errorResponse },
      },
    },
  },
};