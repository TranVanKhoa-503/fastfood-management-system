import { Router } from 'express';
import { StoreController } from '../controllers/store.controller.js';

const router = Router();

router.get('/', StoreController.getStores);
router.post('/', StoreController.createStore);
router.get('/:id', StoreController.getStoreById);
router.put('/:id', StoreController.updateStore);
router.delete('/:id', StoreController.deleteStore);

export default router;
