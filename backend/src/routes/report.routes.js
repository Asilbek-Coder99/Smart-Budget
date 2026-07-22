import { Router } from 'express';
import { getReports, exportCSV, exportExcel, getReportSummary } from '../controllers/report.controller.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/', getReports);
router.get('/summary', getReportSummary);
router.get('/export/csv', exportCSV);
router.get('/export/excel', exportExcel);

export default router;
