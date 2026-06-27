import { Response } from "express";
import { Student } from "../models";
import { AuthRequest } from "../middleware/auth";
import { generateRegistrationNumber } from "../services/feeService";

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const classId = req.query.classId as string;
    const sectionId = req.query.sectionId as string;
    const status = req.query.status as string;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
        { admissionNumber: { $regex: search, $options: "i" } },
        { fatherName: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    if (status) filter.status = status;

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: students,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch students", error: String(error) });
  }
};

export const getStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId", "name")
      .populate("createdBy", "name");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch student", error: String(error) });
  }
};

const parseStudentBody = (body: Record<string, unknown>) => {
  const data = { ...body };
  if (typeof data.address === "string") {
    data.address = JSON.parse(data.address as string);
  }
  if (data.transportRequired !== undefined) {
    data.transportRequired = data.transportRequired === "true" || data.transportRequired === true;
  }
  return data;
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const registrationNumber = await generateRegistrationNumber();
    const photo = req.file ? `/uploads/students/${req.file.filename}` : undefined;
    const parsed = parseStudentBody(req.body);

    const student = await Student.create({
      ...parsed,
      registrationNumber,
      photo,
      createdBy: req.user?.id,
    });

    await student.populate(["classId", "sectionId", "sessionId"]);
    res.status(201).json({ success: true, message: "Student registered successfully", data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to register student", error: String(error) });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const updates = parseStudentBody(req.body);
    delete updates.registrationNumber;

    if (req.file) {
      updates.photo = `/uploads/students/${req.file.filename}`;
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId", "name");

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student updated successfully", data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update student", error: String(error) });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete student", error: String(error) });
  }
};
