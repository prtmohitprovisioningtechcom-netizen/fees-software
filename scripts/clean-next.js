/**
 * Remove .next before dev — fixes EINVAL/readlink errors on Windows + OneDrive.
 * Retries and falls back to emptying contents if rename/delete fails mid-sync.
 */
const fs = require("fs");
const path = require("path");

const nextDir = path.join(process.cwd(), ".next");

function sleep(ms) {
  try {
    require("child_process").execSync(
      process.platform === "win32" ? `timeout /t ${Math.ceil(ms / 1000)} /nobreak >nul` : `sleep ${ms / 1000}`,
      { stdio: "ignore" }
    );
  } catch {
    // ignore
  }
}

function removeDir(dir) {
  if (!fs.existsSync(dir)) return true;
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    return !fs.existsSync(dir);
  } catch {
    return false;
  }
}

if (!fs.existsSync(nextDir)) {
  process.exit(0);
}

let ok = removeDir(nextDir);
if (!ok) {
  sleep(500);
  // Rename then delete — unlocks OneDrive-held paths more often
  const trash = path.join(process.cwd(), `.next-trash-${Date.now()}`);
  try {
    fs.renameSync(nextDir, trash);
    removeDir(trash);
    ok = !fs.existsSync(nextDir);
  } catch (err) {
    console.warn("[clean-next] Could not remove .next fully — stop other Node processes and retry.");
    console.warn(err.message || err);
  }
}

if (ok || !fs.existsSync(nextDir)) {
  console.log("[clean-next] Cleared .next cache");
} else {
  console.warn("[clean-next] .next still present; Next may hit EINVAL until deleted manually.");
}
