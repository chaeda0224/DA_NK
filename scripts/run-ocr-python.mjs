import { delimiter, join } from "node:path";
import { spawnSync } from "node:child_process";
import { projectRoot } from "./lib/config.mjs";
import { requireNamedVenvPython } from "./lib/python-runtime.mjs";

const args = process.argv.slice(2);
if (!args.length) {
  throw new Error("Usage: node scripts/run-ocr-python.mjs <python arguments>");
}

const pythonPath = [join(projectRoot, "workers", "ocr"), process.env.PYTHONPATH]
  .filter(Boolean)
  .join(delimiter);
const result = spawnSync(
  requireNamedVenvPython(projectRoot, ".venv-ocr", "npm run ocr:setup"),
  args,
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      DA_NK_ROOT: projectRoot,
      PYTHONPATH: pythonPath,
      PYTHONUTF8: "1",
      PYTHONIOENCODING: "utf-8",
    },
    stdio: "inherit"
  }
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
