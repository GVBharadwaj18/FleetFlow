import express from 'express';
import { getMonthlyRevenue, getMaintenanceCount, getMostUsedParts } from '../controllers/reportController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All reports are admin-only
router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'mechanic']));

router.get('/revenue', getMonthlyRevenue);
router.get('/maintenance', getMaintenanceCount);
router.get('/parts', getMostUsedParts);

export default router;
