import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/overview', AnalyticsController.getOverview);
router.get('/daily-revenue', AnalyticsController.getDailyRevenue);
router.get('/store-revenue', AnalyticsController.getStoreRevenue);
router.get('/category-revenue', AnalyticsController.getCategoryRevenue);
router.get('/customer-growth', AnalyticsController.getCustomerGrowth);
router.get('/order-status', AnalyticsController.getOrderStatusBreakdown);
router.get('/top-items', AnalyticsController.getTopItems);
router.get('/top-customers', AnalyticsController.getTopCustomers);

export default router;
