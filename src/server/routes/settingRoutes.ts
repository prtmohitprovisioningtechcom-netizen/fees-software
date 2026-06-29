import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getSettings);
router.put("/", authorize("super_admin"), updateSettings);

export default router;
