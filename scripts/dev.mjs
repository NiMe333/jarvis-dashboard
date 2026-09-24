import { spawn } from "node:child_process";

const commands = [
  ["backend", ["run", "dev:backend"]],
  ["frontend", ["run", "dev:frontend"]],
];

const children = commands.map(([name, args]) => {
  const child = spawn("npm", args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(`[${name}] failed to start`, error);
  });

  return child;
});

let shuttingDown = false;

function shutdown(signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach((child) => {
    if (!child.killed) child.kill(signal);
  });
}

children.forEach((child) => {
  child.on("exit", (code) => {
    if (!shuttingDown && code && code !== 0) {
      process.exitCode = code;
      shutdown();
    }
  });
});

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
