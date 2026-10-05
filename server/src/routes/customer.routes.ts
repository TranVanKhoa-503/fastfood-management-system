import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.js';

const router = Router();

router.get('/', CustomerController.getCustomers);
router.post('/', CustomerController.createCustomer);
router.get('/:id', CustomerController.getCustomerById);
router.put('/:id', CustomerController.updateCustomer);
router.delete('/:id', CustomerController.deleteCustomer);

export default router;
