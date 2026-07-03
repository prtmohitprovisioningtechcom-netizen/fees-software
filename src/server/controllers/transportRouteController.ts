import { Response } from "express";
import { Types } from "mongoose";
import { Student, TransportRoute } from "../models";
import { AuthRequest } from "../middleware/auth";
import { DEFAULT_TRANSPORT_ROUTES } from "@/lib/default-transport-routes";

const ensureDefaultRoutes = async () => {
  const count = await TransportRoute.countDocuments();
  if (count > 0) return;
  await TransportRoute.insertMany(DEFAULT_TRANSPORT_ROUTES);
};

export const getTransportRoutes = async (_req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultRoutes();
    const routes = await TransportRoute.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch transport routes", error: String(error) });
  }
};

export const createTransportRoute = async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.body.name || "").trim();
    const monthlyFee = Number(req.body.monthlyFee);
    if (!name) return res.status(400).json({ success: false, message: "Route name is required" });
    if (Number.isNaN(monthlyFee) || monthlyFee < 0) {
      return res.status(400).json({ success: false, message: "Valid monthly fee is required" });
    }

    const existing = await TransportRoute.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.monthlyFee = monthlyFee;
        await existing.save();
        return res.status(201).json({ success: true, message: "Route restored", data: existing });
      }
      return res.status(400).json({ success: false, message: "Route with this name already exists" });
    }

    const route = await TransportRoute.create({ name, monthlyFee });
    res.status(201).json({ success: true, message: "Route created", data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create route", error: String(error) });
  }
};

export const updateTransportRoute = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid route id" });
    }

    const updates: Record<string, unknown> = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.monthlyFee !== undefined) updates.monthlyFee = Number(req.body.monthlyFee);

    const route = await TransportRoute.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!route) return res.status(404).json({ success: false, message: "Route not found" });
    res.json({ success: true, message: "Route updated", data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update route", error: String(error) });
  }
};

export const deleteTransportRoute = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid route id" });
    }

    const inUse = await Student.countDocuments({ transportRouteId: id, status: { $ne: "left" } });
    if (inUse > 0) {
      return res.status(400).json({ success: false, message: "Route is assigned to students and cannot be deleted" });
    }

    const route = await TransportRoute.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!route) return res.status(404).json({ success: false, message: "Route not found" });
    res.json({ success: true, message: "Route removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete route", error: String(error) });
  }
};
