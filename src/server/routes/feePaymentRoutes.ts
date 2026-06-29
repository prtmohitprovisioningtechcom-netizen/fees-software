import { Router } from "express";
import {
  getStudentFeeSummary,
  getStudentsFeeOverview,
  collectFee,
  getPayment,
  getPayments,
} from "../controllers/feePaymentController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { feePaymentSchema } from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/", getPayments);
router.get("/student/:studentId/summary", getStudentFeeSummary);
router.get("/students-overview", getStudentsFeeOverview);
router.post("/collect", validate(feePaymentSchema), collectFee);
router.get("/:id", getPayment);

export default router;
