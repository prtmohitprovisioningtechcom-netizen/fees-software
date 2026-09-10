const { execSync } = require("child_process");

const port = process.env.PORT || "3000";

function freePort() {
  try {
    if (process.platform === "win32") {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      const pids = new Set();

      for (const line of output.split("\n")) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== "0" && /^\d+$/.test(pid)) pids.add(pid);
      }

      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          console.log(`Freed port ${port} (stopped PID ${pid})`);
        } catch {
          // process may have already exited
        }
      }
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: "ignore", shell: true });
      console.log(`Freed port ${port}`);
    }
  } catch {
    // nothing listening on port — ok
  }
}

freePort();
