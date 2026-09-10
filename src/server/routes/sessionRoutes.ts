import { Router } from "express";
import { getSessions, createSession, updateSession, deleteSession } from "../controllers/sessionController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { sessionSchema } from "../validators/schemas";

const router = Router();

router.get("/", authenticate, getSessions);
router.post("/", authenticate, authorize("super_admin"), validate(sessionSchema), createSession);
router.put("/:id", authenticate, authorize("super_admin"), updateSession);
router.delete("/:id", authenticate, authorize("super_admin"), deleteSession);

export default router;
