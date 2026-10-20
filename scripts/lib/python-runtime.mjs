import { existsSync } from "node:fs";
import { join } from "node:path";

export function venvPythonPath(root, platform = process.platform) {
  return namedVenvPythonPath(root, ".venv-search", platform);
}

export function namedVenvPythonPath(root, environmentName, platform = process.platform) {
  return platform === "win32"
    ? join(root, environmentName, "Scripts", "python.exe")
    : join(root, environmentName, "bin", "python");
}

export function requireVenvPython(root, platform = process.platform) {
  const executable = venvPythonPath(root, platform);
  if (!existsSync(executable)) {
    throw new Error(
      `Search Python environment is missing: ${executable}\n`
      + "Run `npm run semantic:setup` (or `npm.cmd run semantic:setup` on Windows)."
    );
  }
  return executable;
}

export function requireNamedVenvPython(root, environmentName, setupCommand, platform = process.platform) {
  const executable = namedVenvPythonPath(root, environmentName, platform);
  if (!existsSync(executable)) {
    throw new Error(
      `Python environment is missing: ${executable}\n`
      + `Run \`${setupCommand}\` first.`
    );
  }
  return executable;
}
