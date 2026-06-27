import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import next from "next";
import connectDB from "./config/database";
import createApp from "./app";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const nextApp = next({ dev, dir: process.cwd() });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
  await connectDB();

  const expressApp = createApp();
  const server = createServer((req, res) => {
    if (req.url?.startsWith("/api") || req.url?.startsWith("/uploads")) {
      expressApp(req, res);
    } else {
      handle(req, res);
    }
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\nPort ${port} is already in use.`);
      console.error("Run: npm run free-port");
      console.error("Then: npm run dev\n");
      process.exit(1);
    }
    throw err;
  });

  server.listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
  });
});
