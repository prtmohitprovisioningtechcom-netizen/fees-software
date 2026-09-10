import { Router } from "express";
import {
  getUsers,
  getPasswordTargets,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changeUserPassword,
} from "../controllers/userController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { userSchema } from "../validators/schemas";

const router = Router();

router.use(authenticate, authorize("super_admin"));

router.get("/", getUsers);
router.get("/password-targets", getPasswordTargets);
router.post("/", validate(userSchema), createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/toggle-status", toggleUserStatus);
router.patch("/:id/password", changeUserPassword);

export default router;
