import { Router } from "express";
import {
  getFeeStructures,
  getFeeStructureByClass,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
} from "../controllers/feeStructureController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { feeStructureSchema } from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/", getFeeStructures);
router.get("/class/:classId/session/:sessionId", getFeeStructureByClass);
router.post("/", authorize("super_admin"), validate(feeStructureSchema), createFeeStructure);
router.put("/:id", authorize("super_admin"), validate(feeStructureSchema.partial()), updateFeeStructure);
router.delete("/:id", authorize("super_admin"), deleteFeeStructure);

export default router;
