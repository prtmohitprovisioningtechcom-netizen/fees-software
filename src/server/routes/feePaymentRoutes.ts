import { Router } from "express";
import {
  getStudentFeeSummary,
  getStudentsFeeOverview,
  collectFee,
  getPayment,
  getPayments,
  refundPayment,
  correctPayment,
} from "../controllers/feePaymentController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  feePaymentSchema,
  feePaymentRefundSchema,
  feePaymentCorrectionSchema,
} from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/", getPayments);
router.get("/student/:studentId/summary", getStudentFeeSummary);
router.get("/students-overview", getStudentsFeeOverview);
router.post("/collect", validate(feePaymentSchema), collectFee);
router.post("/:id/refund", authorize("super_admin"), validate(feePaymentRefundSchema), refundPayment);
router.post("/:id/correct", authorize("super_admin"), validate(feePaymentCorrectionSchema), correctPayment);
router.get("/:id", getPayment);

export default router;
