import { Router } from "express";
import { getDashboardStats, getCollectionReport } from "../controllers/dashboardController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/stats", getDashboardStats);
router.get("/reports", authorize("super_admin"), getCollectionReport);

export default router;
