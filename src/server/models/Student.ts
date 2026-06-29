import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IStudent extends Document {
  registrationNumber: string;
  admissionNumber: string;
  rollNumber: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  mobileNumber: string;
  alternateMobile?: string;
  email?: string;
  gender: "male" | "female" | "other";
  dateOfBirth: Date;
  bloodGroup?: string;
  category?: string;
  religion?: string;
  aadharNumber?: string;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  sessionId: Types.ObjectId;
  admissionDate: Date;
  address: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  photo?: string;
  status: "active" | "inactive" | "left";
  previousSchool?: string;
  transportRequired: boolean;
  initializedAtSdms?: string;
  studentPen?: string;
  studentStateCode?: string;
  minorityGroup?: string;
  bplBeneficiary?: boolean;
  cwsn?: boolean;
  typeOfImpairments?: string;
  isRepeater?: boolean;
  suspectedDuplicate?: boolean;
  entryStatus?: string;
  nameAsPerAadhaar?: string;
  aadhaarValidationStatus?: string;
  mbuStatus?: string;
  apaarId?: string;
  apaarStatus?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    registrationNumber: { type: String, required: true, unique: true },
    admissionNumber: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    motherName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    alternateMobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    dateOfBirth: { type: Date, required: true },
    bloodGroup: { type: String, trim: true },
    category: { type: String, trim: true },
    religion: { type: String, trim: true },
    aadharNumber: { type: String, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "AcademicSession", required: true },
    admissionDate: { type: Date, required: true },
    address: {
      line1: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    photo: { type: String },
    status: { type: String, enum: ["active", "inactive", "left"], default: "active" },
    previousSchool: { type: String, trim: true },
    transportRequired: { type: Boolean, default: false },
    initializedAtSdms: { type: String, trim: true },
    studentPen: { type: String, trim: true },
    studentStateCode: { type: String, trim: true },
    minorityGroup: { type: String, trim: true },
    bplBeneficiary: { type: Boolean, default: false },
    cwsn: { type: Boolean, default: false },
    typeOfImpairments: { type: String, trim: true },
    isRepeater: { type: Boolean, default: false },
    suspectedDuplicate: { type: Boolean, default: false },
    entryStatus: { type: String, trim: true },
    nameAsPerAadhaar: { type: String, trim: true },
    aadhaarValidationStatus: { type: String, trim: true },
    mbuStatus: { type: String, trim: true },
    apaarId: { type: String, trim: true },
    apaarStatus: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

studentSchema.index({ studentName: "text", registrationNumber: "text", admissionNumber: "text", fatherName: "text" });

const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>("Student", studentSchema);
export default Student;
