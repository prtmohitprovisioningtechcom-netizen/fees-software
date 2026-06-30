import { Router } from "express";
import {
  getExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
  getExpenses,
  getExpenseStats,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { expenseSchema, expenseCategorySchema } from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/categories", getExpenseCategories);
router.post("/categories", authorize("super_admin"), validate(expenseCategorySchema), createExpenseCategory);
router.delete("/categories/:id", authorize("super_admin"), deleteExpenseCategory);

router.get("/stats", getExpenseStats);
router.get("/", getExpenses);
router.get("/:id", getExpense);
router.post("/", validate(expenseSchema), createExpense);
router.put("/:id", validate(expenseSchema.partial()), updateExpense);
router.delete("/:id", authorize("super_admin", "admin"), deleteExpense);

export default router;
