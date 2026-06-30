import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["super_admin", "admin"]),
});

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  description: z.string().optional(),
});

export const sectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  classId: z.string().min(1, "Class is required"),
});

export const sessionSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isCurrent: z.boolean().optional(),
});

export const feeStructureSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  sessionId: z.string().min(1, "Session is required"),
  admissionFee: z.coerce.number().min(0),
  monthlyFee: z.coerce.number().min(0),
  annualFee: z.coerce.number().min(0).optional(),
  computerFee: z.coerce.number().min(0),
  examFee: z.coerce.number().min(0),
  transportFee: z.coerce.number().min(0).optional(),
  otherFee: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional(),
});

export const studentFeeDiscountSchema = z.object({
  feeDiscount: z.coerce.number().min(0, "Discount cannot be negative"),
});

export const studentSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required"),
  rollNumber: z.string().min(1, "Roll number is required"),
  studentName: z.string().min(2, "Student name is required"),
  fatherName: z.string().min(2, "Father name is required"),
  motherName: z.string().min(2, "Mother name is required"),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
  alternateMobile: z.string().regex(/^[6-9]\d{9}$/, "Valid mobile number required").optional().or(z.literal("")),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  bloodGroup: z.string().optional(),
  category: z.string().optional(),
  religion: z.string().optional(),
  aadharNumber: z.string().regex(/^\d{12}$/, "Valid 12-digit Aadhar required").optional().or(z.literal("")),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  sessionId: z.string().min(1, "Session is required"),
  admissionDate: z.string().min(1, "Admission date is required"),
  address: z.object({
    line1: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().regex(/^\d{6}$/, "Valid 6-digit pincode required"),
  }),
  status: z.enum(["active", "inactive", "left"]).optional(),
  previousSchool: z.string().optional(),
  transportRequired: z.coerce.boolean().optional(),
});

export const feePaymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  sessionId: z.string().optional(),
  feeDiscount: z.coerce.number().min(0).optional(),
  paymentAmount: z.coerce.number().min(1, "Payment amount must be greater than 0"),
  paymentMode: z.enum(["cash", "upi", "card", "cheque", "bank_transfer"]),
  remarks: z.string().optional(),
});

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export const expenseSchema = z.object({
  title: z.string().min(2, "Title is required"),
  categoryId: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  expenseDate: z.string().min(1, "Date is required"),
  paymentMode: z.enum(["cash", "upi", "card", "cheque", "bank_transfer"]),
  paidTo: z.string().optional(),
  sessionId: z.string().optional(),
  remarks: z.string().optional(),
});
