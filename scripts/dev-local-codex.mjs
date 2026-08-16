import { spawn } from "node:child_process";

const modelFlag = process.argv.indexOf("--model");
const model = modelFlag >= 0 ? process.argv[modelFlag + 1] : process.env.CODEX_MODEL || "gpt-5.6-sol";
const port = process.env.CODEX_BRIDGE_PORT || "8789";

const sharedEnv = {
  ...process.env,
  CODEX_MODEL: model,
  CODEX_BRIDGE_PORT: port,
};

const bridge = spawn(process.execPath, ["scripts/codex-bridge.mjs"], {
  cwd: process.cwd(),
  env: sharedEnv,
  stdio: "inherit",
});

const web = spawn("npm", ["run", "dev"], {
  cwd: process.cwd(),
  env: {
    ...sharedEnv,
    LOCAL_CODEX_BRIDGE_URL: `http://127.0.0.1:${port}`,
  },
  stdio: "inherit",
});

let stopping = false;
function stop(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  bridge.kill(signal);
  web.kill(signal);
}

bridge.on("exit", (code) => {
  if (!stopping && code !== 0) {
    console.error(`[dev:codex] bridge stopped with code ${code}`);
    stop();
    process.exitCode = code || 1;
  }
});
web.on("exit", (code) => {
  if (!stopping) {
    stop();
    process.exitCode = code || 0;
  }
});
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

console.log(`[dev:codex] local model: ${model}`);
