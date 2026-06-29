import { Router } from "express";
import { getStudents, getStudent, createStudent, importStudents, updateStudent, deleteStudent } from "../controllers/studentController";
import { authenticate, authorize } from "../middleware/auth";
import { uploadStudentExcel, uploadStudentPhoto } from "../middleware/upload";

const router = Router();

router.use(authenticate);

router.get("/", getStudents);
router.post("/import", authorize("super_admin"), uploadStudentExcel.single("file"), importStudents);
router.get("/:id", getStudent);
router.post("/", uploadStudentPhoto.single("photo"), createStudent);
router.put("/:id", uploadStudentPhoto.single("photo"), updateStudent);
router.delete("/:id", deleteStudent);

export default router;
