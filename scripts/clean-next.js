/**
 * Remove .next before dev — fixes EINVAL/readlink errors on Windows + OneDrive.
 */
const fs = require("fs");
const path = require("path");

const nextDir = path.join(process.cwd(), ".next");

if (!fs.existsSync(nextDir)) {
  process.exit(0);
}

try {
  fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
} catch (err) {
  console.warn("[clean-next] Could not remove .next — stop dev server and delete .next manually.");
  console.warn(err.message);
}
