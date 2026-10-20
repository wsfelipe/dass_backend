# Dass Funcionários API

API REST para cadastro, consulta, edição e exclusão de funcionários e seus tamanhos de camiseta e calçado. A API usa Node.js, Express e PostgreSQL.

## Requisitos

- Node.js 18 ou superior
- Docker (para subar o PostgreSQL local via `docker-compose.yml`)
- PostgreSQL acessível pela aplicação

## Configuração

```powershell
npm install
Copy-Item .env.example .env
```

Subir o banco local (PostgreSQL via Docker — já aplica o schema automaticamente):

```powershell
docker compose up -d db
Copy-Item .env.example .env
```

Crie a tabela da aplicação no banco (se estiver usando banco remoto; com Docker o schema já vem aplicado):

```powershell
npm run db:create
```

Inserir 20 usuários fictícios com CPFs válidos (para testes):

```powershell
node scripts/insert_employees.js
```

Inicie a API em desenvolvimento ou produção:

```powershell
npm run dev
npm start
```

A API estará disponível em `http://localhost:3000`. O banco pode ser local ou remoto; não é provisionado por este repositório.

## Documentação

- Swagger UI: `http://localhost:3000/docs`
- Especificação OpenAPI: `http://localhost:3000/openapi.json`
- Health check: `http://localhost:3000/health`

## Endpoints

| Método | Caminho | Ação |
| --- | --- | --- |
| GET | `/employees` | Lista com paginação e filtros `search`, `cpf`, `name`, `email`, `shirtSize` e `shoeSize` |
| GET | `/employees/:id` | Consulta um funcionário |
| POST | `/employees` | Cadastra um funcionário |
| PUT | `/employees/:id` | Atualiza um funcionário |
| DELETE | `/employees/:id` | Exclui um funcionário |

Exemplo de corpo para `POST` e `PUT`:

```json
{
	"cpf": "529.982.247-25",
	"name": "Maria da Silva",
	"email": "maria@example.com",
	"shirtSize": "M",
	"shoeSize": 38
}
```

`GET /employees` retorna `{ "data": [], "meta": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } }`. A pesquisa `search` procura por nome, e-mail ou CPF. Os demais filtros podem ser combinados.

Filtros de `shirtSize` e `shoeSize` aceitam array JSON (múltipla escolha):
```bash
GET /employees?shirtSize=["P","M","G"]&shoeSize=[40,42]
```

## Validação

CPF, e-mail, tamanhos, campos obrigatórios e paginação são validados pela API. Respostas de validação usam HTTP `422`; CPF/e-mail duplicados usam `409`; registros inexistentes usam `404`.

Execute os testes com:

```powershell
npm test
```