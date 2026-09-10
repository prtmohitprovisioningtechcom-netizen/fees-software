import { Router } from "express";
import { getDashboardStats, getQuarterDetails, getCollectionReport, downloadCollectionReportExcel, getReportCollectors } from "../controllers/dashboardController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/stats", getDashboardStats);
router.get("/quarter-details", getQuarterDetails);
router.get("/reports/collectors", authorize("super_admin"), getReportCollectors);
router.get("/reports/export", downloadCollectionReportExcel);
router.get("/reports", getCollectionReport);

export default router;
