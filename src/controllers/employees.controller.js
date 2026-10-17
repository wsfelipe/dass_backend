const service = require('../services/employees.service');

async function list(req, res) {
  const result = await service.list(req.query); // uso direto para garantir filtro
  res.json(result);
}

async function getById(req, res) {
  const employee = await service.getById(req.valid.params.id);
  res.json(employee);
}

async function create(req, res) {
  const employee = await service.create(req.valid.body);
  res.status(201).json(employee);
}

async function update(req, res) {
  const employee = await service.update(req.valid.params.id, req.valid.body);
  res.json(employee);
}

async function remove(req, res) {
  await service.remove(req.valid.params.id);
  res.status(204).send();
}

module.exports = { list, getById, create, update, remove };
