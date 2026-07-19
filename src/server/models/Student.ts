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
  transportRouteId?: Types.ObjectId;
  feeDiscount: number;
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
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    admissionNumber: { type: String, trim: true, default: "" },
    rollNumber: { type: String, trim: true, default: "" },
    studentName: { type: String, trim: true, default: "Student" },
    fatherName: { type: String, trim: true, default: "-" },
    motherName: { type: String, trim: true, default: "-" },
    mobileNumber: { type: String, trim: true, default: "0000000000" },
    alternateMobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },
    dateOfBirth: { type: Date, default: Date.now },
    bloodGroup: { type: String, trim: true },
    category: { type: String, trim: true },
    religion: { type: String, trim: true },
    aadharNumber: { type: String, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class" },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
    sessionId: { type: Schema.Types.ObjectId, ref: "AcademicSession" },
    admissionDate: { type: Date, default: Date.now },
    address: {
      line1: { type: String, trim: true, default: "-" },
      city: { type: String, trim: true, default: "-" },
      state: { type: String, trim: true, default: "-" },
      pincode: { type: String, trim: true, default: "000000" },
    },
    photo: { type: String },
    status: { type: String, enum: ["active", "inactive", "left"], default: "active" },
    previousSchool: { type: String, trim: true },
    transportRequired: { type: Boolean, default: false },
    transportRouteId: { type: Schema.Types.ObjectId, ref: "TransportRoute" },
    feeDiscount: { type: Number, min: 0, default: 0 },
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
studentSchema.index({ status: 1, studentName: 1 });
studentSchema.index({ status: 1, classId: 1, sectionId: 1 });

const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>("Student", studentSchema);
export default Student;
