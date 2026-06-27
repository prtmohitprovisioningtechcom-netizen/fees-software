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
  totalStudents: number;
  totalFeeCollected: number;
  pendingFees: number;
  todayCollection: number;
  recentPayments: RecentPayment[];
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
  paidAmount: number;
  remainingAmount: number;
  previousDue: number;
  currentPayment: number;
  balance: number;
  paymentStatus: "paid" | "partial" | "pending";
  feeBreakdown: {
    admissionFee: number;
    monthlyFee: number;
    computerFee: number;
    examFee: number;
    transportFee: number;
    otherFee: number;
  };
}
