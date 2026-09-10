import { Router } from "express";
import {
  createTransportRoute,
  deleteTransportRoute,
  getTransportRoutes,
  updateTransportRoute,
} from "../controllers/transportRouteController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", getTransportRoutes);
router.post("/", authorize("super_admin"), createTransportRoute);
router.put("/:id", authorize("super_admin"), updateTransportRoute);
router.delete("/:id", authorize("super_admin"), deleteTransportRoute);

export default router;
