export type UserRole = "super_admin" | "admin";

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  session: { _id: string; name: string };
  totalStudents: number;
  totalFeeCollected?: number;
  pendingFees: number;
  todayCollection: number;
  recentPayments: RecentPayment[];
  pendingStudents: PendingStudent[];
}

export interface PendingStudent {
  _id: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: "paid" | "partial" | "pending";
  hasFeeStructure: boolean;
}

export interface StudentFeeOverview {
  _id: string;
  registrationNumber: string;
  admissionNumber: string;
  studentName: string;
  fatherName: string;
  mobileNumber: string;
  classId: { _id: string; name: string };
  sectionId: { _id: string; name: string };
  sessionId: string;
  sessionName: string;
  grossTotal: number;
  totalDiscount: number;
  feeDiscount: number;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: "paid" | "partial" | "pending";
  hasFeeStructure: boolean;
}

export interface ExpenseCategory {
  _id: string;
  name: string;
}

export interface Expense {
  _id: string;
  voucherNumber: string;
  title: string;
  categoryId: { _id: string; name: string };
  amount: number;
  expenseDate: string;
  paymentMode: string;
  paidTo?: string;
  sessionId?: { _id: string; name: string };
  remarks?: string;
  createdBy?: { _id: string; name: string };
}

export interface ExpenseStats {
  todayTotal: number;
  todayCount: number;
  monthTotal: number;
  monthCount: number;
  rangeTotal: number;
  rangeCount: number;
  byCategory: { categoryId: string; categoryName: string; total: number; count: number }[];
  recentExpenses: Expense[];
}

export interface RecentPayment {
  _id: string;
  receiptNumber: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  paymentStatus: string;
}

export interface FeeCalculation {
  totalFee: number;
  grossTotal: number;
  totalDiscount: number;
  paidAmount: number;
  remainingAmount: number;
  previousDue: number;
  currentPayment: number;
  balance: number;
  paymentStatus: "paid" | "partial" | "pending";
  includeAdmission?: boolean;
  quarterlySchedule?: {
    quarter: number;
    label: string;
    tuitionDue: number;
    annualChargesDue: number;
    admissionDue: number;
    componentsDue?: { key: string; label: string; amount: number }[];
    totalDue: number;
    paid: number;
    pending: number;
    status: "paid" | "partial" | "pending";
  }[];
  feeBreakdown: {
    admissionFee: number;
    monthlyFee: number;
    quarterlyTuition?: number;
    annualFee: number;
    computerFee: number;
    examFee: number;
    transportFee: number;
    otherFee: number;
    annualCharges?: number;
    grossTotal: number;
    structureDiscount: number;
    studentDiscount: number;
    totalDiscount: number;
    includeAdmission?: boolean;
  };
}

export interface SchoolBranding {
  schoolName: string;
  appName: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
}
