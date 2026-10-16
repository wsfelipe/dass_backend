const { Router } = require('express');
const controller = require('../controllers/employees.controller');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const {
  employeeBodySchema,
  listQuerySchema,
  idParamSchema,
} = require('../validators/employee.schema');

const router = Router();

router.get('/', validate(listQuerySchema, 'query'), asyncHandler(controller.list));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.getById));
router.post('/', validate(employeeBodySchema), asyncHandler(controller.create));
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(employeeBodySchema),
  asyncHandler(controller.update)
);
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.remove));

module.exports = router;
