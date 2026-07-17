import { Router } from 'express';

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import profileRoutes from './profileRoutes.js';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import brandRoutes from './brandRoutes.js';
import unitRoutes from './unitRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import rawMaterialRoutes from './rawMaterialRoutes.js';
import purchaseOrderRoutes from './purchaseOrderRoutes.js';
import customerRoutes from './customerRoutes.js';
import salesOrderRoutes from './salesOrderRoutes.js';
import stockRoutes from './stockRoutes.js';
import stockAdjustmentRoutes from './stockAdjustmentRoutes.js';
import creditRoutes from './creditRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import reportRoutes from './reportRoutes.js';
import staffPerformanceRoutes from './staffPerformanceRoutes.js';
import productionRoutes from './productionRoutes.js';
import activityLogRoutes from './activityLogRoutes.js';
import ledgerRoutes from './ledgerRoutes.js';
import financialReportRoutes from './financialReportRoutes.js';

const router = Router();

router.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date() }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/units', unitRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/raw-materials', rawMaterialRoutes); // placeholder — see rawMaterialController.js
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/customers', customerRoutes);
router.use('/sales-orders', salesOrderRoutes);

router.use('/stock', stockRoutes);
router.use('/stock-adjustments', stockAdjustmentRoutes);
router.use('/credit', creditRoutes);
router.use('/payments', paymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/staff-performance', staffPerformanceRoutes);
router.use('/production', productionRoutes); // placeholder — see productionController.js
router.use('/activity-logs', activityLogRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/financial-reports', financialReportRoutes);

export default router;
