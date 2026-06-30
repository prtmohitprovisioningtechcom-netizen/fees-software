import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IExpense extends Document {
  voucherNumber: string;
  title: string;
  categoryId: Types.ObjectId;
  amount: number;
  expenseDate: Date;
  paymentMode: "cash" | "upi" | "card" | "cheque" | "bank_transfer";
  paidTo?: string;
  sessionId?: Types.ObjectId;
  remarks?: string;
  status: "active" | "cancelled";
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    voucherNumber: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "ExpenseCategory", required: true },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, required: true, default: Date.now },
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "card", "cheque", "bank_transfer"],
      required: true,
    },
    paidTo: { type: String, trim: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "AcademicSession" },
    remarks: { type: String, trim: true },
    status: { type: String, enum: ["active", "cancelled"], default: "active" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ categoryId: 1, expenseDate: -1 });
expenseSchema.index({ title: "text", paidTo: "text", voucherNumber: "text" });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", expenseSchema);

export default Expense;
