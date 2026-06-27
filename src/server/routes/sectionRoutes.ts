import { Router } from "express";
import { getSections, createSection, updateSection, deleteSection } from "../controllers/sectionController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { sectionSchema } from "../validators/schemas";

const router = Router();

router.get("/", authenticate, getSections);
router.post("/", authenticate, authorize("super_admin"), validate(sectionSchema), createSection);
router.put("/:id", authenticate, authorize("super_admin"), updateSection);
router.delete("/:id", authenticate, authorize("super_admin"), deleteSection);

export default router;
