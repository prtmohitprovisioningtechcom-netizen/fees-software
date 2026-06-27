import { Router } from "express";
import { login, getProfile } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { loginSchema } from "../validators/schemas";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.get("/profile", authenticate, getProfile);

export default router;
