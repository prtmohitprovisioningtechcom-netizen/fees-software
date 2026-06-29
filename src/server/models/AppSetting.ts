import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppSetting extends Document {
  schoolName: string;
  appName: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  updatedAt: Date;
  createdAt: Date;
}

const appSettingSchema = new Schema<IAppSetting>(
  {
    schoolName: { type: String, required: true, trim: true, default: "School ERP" },
    appName: { type: String, required: true, trim: true, default: "Fee Management" },
    logo: { type: String },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { timestamps: true }
);

const AppSetting: Model<IAppSetting> =
  mongoose.models.AppSetting || mongoose.model<IAppSetting>("AppSetting", appSettingSchema);

export default AppSetting;
