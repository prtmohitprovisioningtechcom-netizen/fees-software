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
import settingRoutes from "./routes/settingRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import transportRouteRoutes from "./routes/transportRouteRoutes";
import { getPublicBranding } from "./controllers/settingController";

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(
    express.json({
      limit: "15mb",
      type: (req) => {
        const method = req.method || "GET";
        if (method === "GET" || method === "HEAD" || method === "OPTIONS") return false;
        const contentLength = Number(req.headers["content-length"] || 0);
        if (contentLength <= 0 && (method === "DELETE" || method === "PATCH")) return false;
        const contentType = String(req.headers["content-type"] || "");
        return contentType.includes("json");
      },
    })
  );
  app.use(
    express.urlencoded({
      extended: true,
      limit: "15mb",
      type: (req) => {
        const method = req.method || "GET";
        if (method === "GET" || method === "HEAD" || method === "DELETE" || method === "OPTIONS") return false;
        const contentType = String(req.headers["content-type"] || "");
        return contentType.includes("application/x-www-form-urlencoded");
      },
    })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/classes", classRoutes);
  app.use("/api/sections", sectionRoutes);
  app.use("/api/sessions", sessionRoutes);
  app.use("/api/fee-structures", feeStructureRoutes);
  app.use("/api/students", studentRoutes);
  app.use("/api/fee-payments", feePaymentRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.get("/api/settings/branding", getPublicBranding);
  app.use("/api/settings", settingRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/transport-routes", transportRouteRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "API is running" });
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) return next(err);
    console.error("API error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  });

  return app;
};

export default createApp;
