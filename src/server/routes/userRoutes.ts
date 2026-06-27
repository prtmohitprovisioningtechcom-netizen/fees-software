import { Router } from "express";
import { getUsers, createUser, updateUser, deleteUser, toggleUserStatus } from "../controllers/userController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { userSchema } from "../validators/schemas";

const router = Router();

router.use(authenticate, authorize("super_admin"));

router.get("/", getUsers);
router.post("/", validate(userSchema), createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/toggle-status", toggleUserStatus);

export default router;
