import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import classRoutes from "./routes/classRoutes";
import sectionRoutes from "./routes/sectionRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import feeStructureRoutes from "./routes/feeStructureRoutes";
import studentRoutes from "./routes/studentRoutes";
import feePaymentRoutes from "./routes/feePaymentRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/classes", classRoutes);
  app.use("/api/sections", sectionRoutes);
  app.use("/api/sessions", sessionRoutes);
  app.use("/api/fee-structures", feeStructureRoutes);
  app.use("/api/students", studentRoutes);
  app.use("/api/fee-payments", feePaymentRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "API is running" });
  });

  return app;
};

export default createApp;
