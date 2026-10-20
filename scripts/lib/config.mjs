import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function merge(base, extra) {
  const result = { ...base };
  for (const [key, value] of Object.entries(extra ?? {})) {
    result[key] = value && typeof value === "object" && !Array.isArray(value)
      ? merge(base[key] ?? {}, value)
      : value;
  }
  return result;
}

export function loadConfig() {
  const defaultPath = join(projectRoot, "config", "default.json");
  const localPath = process.env.DA_NK_CONFIG
    ? resolve(process.env.DA_NK_CONFIG)
    : join(projectRoot, "config", "local.json");

  let config = readJson(defaultPath);
  if (existsSync(localPath)) config = merge(config, readJson(localPath));
  if (process.env.DA_NK_DATA_DIR) config.data_dir = process.env.DA_NK_DATA_DIR;
  if (process.env.DA_NK_HTTP_PORT) config.http_port = Number(process.env.DA_NK_HTTP_PORT);

  return { config, defaultPath, localPath };
}

export function resolveProjectPath(value) {
  if (!value) return null;
  return isAbsolute(value) ? resolve(value) : resolve(projectRoot, value);
}

export function configuredPath(config, key) {
  return resolveProjectPath(config.paths?.[key]);
}
