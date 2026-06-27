import { Router } from "express";
import { getStudents, getStudent, createStudent, updateStudent, deleteStudent } from "../controllers/studentController";
import { authenticate } from "../middleware/auth";
import { uploadStudentPhoto } from "../middleware/upload";

const router = Router();

router.use(authenticate);

router.get("/", getStudents);
router.get("/:id", getStudent);
router.post("/", uploadStudentPhoto.single("photo"), createStudent);
router.put("/:id", uploadStudentPhoto.single("photo"), updateStudent);
router.delete("/:id", deleteStudent);

export default router;
