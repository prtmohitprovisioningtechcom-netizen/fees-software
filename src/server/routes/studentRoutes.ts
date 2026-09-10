import { Router } from "express";
import { getStudents, getStudent, createStudent, importStudents, updateStudent, deleteStudent, updateStudentFeeDiscount } from "../controllers/studentController";
import { authenticate, authorize } from "../middleware/auth";
import { uploadStudentExcel, uploadStudentPhoto } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { studentFeeDiscountSchema } from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/", getStudents);
router.post("/import", authorize("super_admin"), uploadStudentExcel.single("file"), importStudents);
router.get("/:id", getStudent);
router.patch("/:id/fee-discount", validate(studentFeeDiscountSchema), updateStudentFeeDiscount);
router.post("/", uploadStudentPhoto.single("photo"), createStudent);
router.put("/:id", uploadStudentPhoto.single("photo"), updateStudent);
router.delete("/:id", deleteStudent);

export default router;
