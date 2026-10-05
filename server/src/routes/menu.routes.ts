import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller.js';

const router = Router();

router.get('/', MenuController.getMenuItems);
router.post('/', MenuController.createMenuItem);
router.get('/:id', MenuController.getMenuItemById);
router.put('/:id', MenuController.updateMenuItem);
router.delete('/:id', MenuController.deleteMenuItem);

export default router;
