import { Router } from 'express';
import { ShipperController } from '../controllers/shipper.controller.js';

const router = Router();

router.get('/', ShipperController.getShippers);
router.post('/', ShipperController.createShipper);
router.get('/:id', ShipperController.getShipperById);
router.put('/:id', ShipperController.updateShipper);
router.delete('/:id', ShipperController.deleteShipper);

export default router;
