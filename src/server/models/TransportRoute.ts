import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransportRoute extends Document {
  name: string;
  monthlyFee: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const transportRouteSchema = new Schema<ITransportRoute>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    monthlyFee: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const TransportRoute: Model<ITransportRoute> =
  mongoose.models.TransportRoute ||
  mongoose.model<ITransportRoute>("TransportRoute", transportRouteSchema);

export default TransportRoute;
