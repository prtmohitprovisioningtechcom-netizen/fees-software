import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { existsSync, rmSync, renameSync } from "fs";
import { join } from "path";
import next from "next";
import connectDB from "./config/database";
import createApp from "./app";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const cwd = process.cwd();

function clearNextCache() {
  const nextDir = join(cwd, ".next");
  if (!existsSync(nextDir)) return;
  try {
    rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    console.log("> Cleared corrupt .next cache");
  } catch {
    try {
      const trash = join(cwd, `.next-trash-${Date.now()}`);
      renameSync(nextDir, trash);
      rmSync(trash, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      console.log("> Cleared corrupt .next cache (rename)");
    } catch (err) {
      console.warn("> Could not clear .next — run: npm run clean-next");
      console.warn(err);
    }
  }
}

async function prepareNext() {
  const nextApp = next({ dev, dir: cwd });
  try {
    await nextApp.prepare();
    return nextApp;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    const msg = err instanceof Error ? err.message : String(err);
    // Windows + OneDrive often corrupt .next → EINVAL on readlink during cleanup
    if (dev && (code === "EINVAL" || msg.includes("readlink") || msg.includes("EINVAL"))) {
      console.warn("> Next.js cache error — clearing .next and retrying once…");
      clearNextCache();
      const retryApp = next({ dev, dir: cwd });
      await retryApp.prepare();
      return retryApp;
    }
    throw err;
  }
}

prepareNext()
  .then(async (nextApp) => {
    const handle = nextApp.getRequestHandler();
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
  })
  .catch((err) => {
    console.error("> Failed to start server:", err);
    process.exit(1);
  });
