import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFeeStructure extends Document {
  classId: Types.ObjectId;
  sessionId: Types.ObjectId;
  admissionFee: number;
  monthlyFee: number;
  annualFee: number;
  computerFee: number;
  examFee: number;
  transportFee: number;
  otherFee: number;
  discount: number;
  totalFee: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const feeStructureSchema = new Schema<IFeeStructure>(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "AcademicSession", required: true },
    admissionFee: { type: Number, required: true, min: 0, default: 0 },
    monthlyFee: { type: Number, required: true, min: 0, default: 0 },
    annualFee: { type: Number, required: true, min: 0, default: 0 },
    computerFee: { type: Number, required: true, min: 0, default: 0 },
    examFee: { type: Number, required: true, min: 0, default: 0 },
    transportFee: { type: Number, required: true, min: 0, default: 0 },
    otherFee: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    totalFee: { type: Number, required: true, min: 0, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

feeStructureSchema.index({ classId: 1, sessionId: 1 }, { unique: true });

feeStructureSchema.pre("save", function (next) {
  const tuition = this.monthlyFee * 12;
  const annualCharges = this.examFee + this.computerFee + this.annualFee + this.otherFee;
  const gross = tuition + annualCharges;
  this.totalFee = Math.max(0, gross - (this.discount || 0));
  next();
});

const FeeStructure: Model<IFeeStructure> =
  mongoose.models.FeeStructure || mongoose.model<IFeeStructure>("FeeStructure", feeStructureSchema);
export default FeeStructure;
