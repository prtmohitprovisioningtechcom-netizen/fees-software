import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/server/config/database";
import createApp from "@/server/app";

const app = createApp();

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("API handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}
