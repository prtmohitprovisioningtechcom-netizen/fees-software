import mongoose, { Schema, Document, Model, Types } from "mongoose";

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
  paymentDate: Date;
  collectedBy: Types.ObjectId;
  feeBreakdown: {
    admissionFee: number;
    monthlyFee: number;
    computerFee: number;
    examFee: number;
    transportFee: number;
    otherFee: number;
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
    paymentDate: { type: Date, default: Date.now },
    collectedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    feeBreakdown: {
      admissionFee: { type: Number, default: 0 },
      monthlyFee: { type: Number, default: 0 },
      computerFee: { type: Number, default: 0 },
      examFee: { type: Number, default: 0 },
      transportFee: { type: Number, default: 0 },
      otherFee: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

feePaymentSchema.index({ sessionId: 1, studentId: 1 });
feePaymentSchema.index({ sessionId: 1, paymentDate: -1 });
feePaymentSchema.index({ collectedBy: 1, sessionId: 1 });

const FeePayment: Model<IFeePayment> =
  mongoose.models.FeePayment || mongoose.model<IFeePayment>("FeePayment", feePaymentSchema);
export default FeePayment;
