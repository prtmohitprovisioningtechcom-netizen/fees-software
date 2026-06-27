import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISection extends Document {
  name: string;
  classId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<ISection>(
  {
    name: { type: String, required: true, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sectionSchema.index({ classId: 1, name: 1 }, { unique: true });

const Section: Model<ISection> = mongoose.models.Section || mongoose.model<ISection>("Section", sectionSchema);
export default Section;
