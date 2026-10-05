import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller.js';

const router = Router();

router.get('/', ReviewController.getReviews);
router.post('/', ReviewController.createReview);
router.delete('/:id', ReviewController.deleteReview);

export default router;
