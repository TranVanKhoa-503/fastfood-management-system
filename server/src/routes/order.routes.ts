import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';

const router = Router();

router.get('/export/csv', OrderController.exportCSV);
router.get('/', OrderController.getOrders);
router.post('/', OrderController.createOrder);
router.get('/:id', OrderController.getOrderById);
router.patch('/:id/status', OrderController.updateStatus);
router.patch('/:id/assign-shipper', OrderController.assignShipper);

export default router;
