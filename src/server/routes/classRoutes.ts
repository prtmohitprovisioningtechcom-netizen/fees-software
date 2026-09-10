import { Router } from "express";
import { getClasses, createClass, updateClass, deleteClass } from "../controllers/classController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { classSchema } from "../validators/schemas";

const router = Router();

router.get("/", authenticate, getClasses);
router.post("/", authenticate, authorize("super_admin"), validate(classSchema), createClass);
router.put("/:id", authenticate, authorize("super_admin"), updateClass);
router.delete("/:id", authenticate, authorize("super_admin"), deleteClass);

export default router;
