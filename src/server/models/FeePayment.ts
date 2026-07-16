import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type FeePaymentRecordStatus = "active" | "refunded" | "reversed" | "corrected";

export interface IFeePayment extends Document {
  receiptNumber: string;
  studentId: Types.ObjectId;
  sessionId: Types.ObjectId;
  feeStructureId: Types.ObjectId;
  totalFee: number;
  paidAmount: number;
  remainingAmount: number;
  previousDue: number;
  currentPayment: number;
  balance: number;
  paymentStatus: "paid" | "partial" | "pending";
  paymentMode: "cash" | "upi" | "card" | "cheque" | "bank_transfer";
  remarks?: string;
  customSessionName?: string;
  isStandalonePreviousDues?: boolean;
  paymentDate: Date;
  quarter?: 1 | 2 | 3 | 4;
  paymentType?: "quarterly" | "monthly" | "full_year" | "custom";
  collectedBy: Types.ObjectId;
  /** Lifecycle — missing/undefined treated as active for legacy rows */
  recordStatus?: FeePaymentRecordStatus;
  auditReason?: string;
  auditedBy?: Types.ObjectId;
  auditedAt?: Date;
  replacesPaymentId?: Types.ObjectId;
  replacedByPaymentId?: Types.ObjectId;
  feeBreakdown: {
    admissionFee: number;
    monthlyFee: number;
    quarterlyTuition?: number;
    annualFee?: number;
    computerFee: number;
    examFee: number;
    transportFee: number;
    transportRouteName?: string;
    otherFee: number;
    annualCharges?: number;
    grossTotal?: number;
    structureDiscount?: number;
    studentDiscount?: number;
    totalDiscount?: number;
    includeAdmission?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const feePaymentSchema = new Schema<IFeePayment>(
  {
    receiptNumber: { type: String, required: true, unique: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "AcademicSession", required: true },
    feeStructureId: { type: Schema.Types.ObjectId, ref: "FeeStructure", required: true },
    totalFee: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },
    previousDue: { type: Number, required: true },
    currentPayment: { type: Number, required: true, min: 0 },
    balance: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["paid", "partial", "pending"], required: true },
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "card", "cheque", "bank_transfer"],
      required: true,
    },
    remarks: { type: String, trim: true },
    customSessionName: { type: String, trim: true },
    isStandalonePreviousDues: { type: Boolean, default: false },
    paymentDate: { type: Date, default: Date.now },
    quarter: { type: Number, enum: [1, 2, 3, 4] },
    paymentType: { type: String, enum: ["quarterly", "monthly", "full_year", "custom"], default: "custom" },
    collectedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordStatus: {
      type: String,
      enum: ["active", "refunded", "reversed", "corrected"],
      default: "active",
    },
    auditReason: { type: String, trim: true },
    auditedBy: { type: Schema.Types.ObjectId, ref: "User" },
    auditedAt: { type: Date },
    replacesPaymentId: { type: Schema.Types.ObjectId, ref: "FeePayment" },
    replacedByPaymentId: { type: Schema.Types.ObjectId, ref: "FeePayment" },
    feeBreakdown: {
      admissionFee: { type: Number, default: 0 },
      monthlyFee: { type: Number, default: 0 },
      quarterlyTuition: { type: Number, default: 0 },
      annualFee: { type: Number, default: 0 },
      computerFee: { type: Number, default: 0 },
      examFee: { type: Number, default: 0 },
      transportFee: { type: Number, default: 0 },
      transportRouteName: { type: String, default: "" },
      otherFee: { type: Number, default: 0 },
      annualCharges: { type: Number, default: 0 },
      grossTotal: { type: Number, default: 0 },
      structureDiscount: { type: Number, default: 0 },
      studentDiscount: { type: Number, default: 0 },
      totalDiscount: { type: Number, default: 0 },
      includeAdmission: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

feePaymentSchema.index({ sessionId: 1, studentId: 1 });
feePaymentSchema.index({ sessionId: 1, paymentDate: -1 });
feePaymentSchema.index({ collectedBy: 1, sessionId: 1 });
feePaymentSchema.index({ sessionId: 1, quarter: 1 });
feePaymentSchema.index({ studentId: 1, sessionId: 1, paymentDate: -1 });
feePaymentSchema.index({ recordStatus: 1, sessionId: 1, paymentDate: -1 });

const FeePayment: Model<IFeePayment> = (() => {
  const existing = mongoose.models.FeePayment as Model<IFeePayment> | undefined;
  if (existing) {
    // Hot-reload: ensure lifecycle fields exist on already-compiled model
    if (!existing.schema.path("recordStatus")) {
      existing.schema.add({
        recordStatus: {
          type: String,
          enum: ["active", "refunded", "reversed", "corrected"],
          default: "active",
        },
        auditReason: { type: String, trim: true },
        auditedBy: { type: Schema.Types.ObjectId, ref: "User" },
        auditedAt: { type: Date },
        replacesPaymentId: { type: Schema.Types.ObjectId, ref: "FeePayment" },
        replacedByPaymentId: { type: Schema.Types.ObjectId, ref: "FeePayment" },
      });
    }
    return existing;
  }
  return mongoose.model<IFeePayment>("FeePayment", feePaymentSchema);
})();
export default FeePayment;
