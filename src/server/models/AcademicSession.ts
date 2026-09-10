import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAcademicSession extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<IAcademicSession>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

sessionSchema.index({ isActive: 1, startDate: -1 });
sessionSchema.index({ isActive: 1, isCurrent: 1 });

const AcademicSession: Model<IAcademicSession> =
  mongoose.models.AcademicSession || mongoose.model<IAcademicSession>("AcademicSession", sessionSchema);
export default AcademicSession;
