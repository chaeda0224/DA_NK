import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { projectRoot } from "./lib/config.mjs";
import { namedVenvPythonPath } from "./lib/python-runtime.mjs";

const environmentPython = namedVenvPythonPath(projectRoot, ".venv-ocr");

function commandWorks(command, args) {
  const result = spawnSync(command, args, { cwd: projectRoot, stdio: "ignore" });
  return !result.error && result.status === 0;
}

if (!existsSync(environmentPython)) {
  const candidates = process.platform === "win32"
    ? [["py", ["-3"]], ["python", []]]
    : [["python3", []], ["python", []]];
  const candidate = candidates.find(([command, args]) => commandWorks(command, [...args, "--version"]));
  if (!candidate) throw new Error("Python 3.10 or newer is required.");
  const [command, args] = candidate;
  const created = spawnSync(command, [...args, "-m", "venv", ".venv-ocr"], {
    cwd: projectRoot,
    stdio: "inherit"
  });
  if (created.error) throw created.error;
  if (created.status !== 0) process.exit(created.status ?? 1);
}

const installed = spawnSync(
  environmentPython,
  ["-m", "pip", "install", "-r", "workers/ocr/requirements.txt"],
  { cwd: projectRoot, stdio: "inherit" }
);
if (installed.error) throw installed.error;
process.exitCode = installed.status ?? 1;
