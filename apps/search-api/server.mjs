import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LocalSearchEngine } from "../../packages/search/src/local-search-engine.mjs";

export function createSearchServer(documents) {
  const engine = new LocalSearchEngine(documents);
  return createServer((request, response) => {
    const reply = (status, payload) => {
      response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
      response.end(`${JSON.stringify(payload)}\n`);
    };
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (request.method !== "GET") return reply(405, { error: "method_not_allowed" });
    if (url.pathname === "/health") return reply(200, { status: "ok", document_count: documents.length });
    if (url.pathname !== "/search") return reply(404, { error: "not_found" });
    const query = url.searchParams.get("q")?.trim();
    if (!query) return reply(400, { error: "query_required", parameter: "q" });
    const limit = Number(url.searchParams.get("limit") ?? 20);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return reply(400, { error: "invalid_parameter", parameter: "limit" });
    }
    return reply(200, engine.search(query, {
      datasetIds: url.searchParams.getAll("dataset_id").filter(Boolean),
      documentTypes: url.searchParams.getAll("document_type").filter(Boolean),
      limit,
    }));
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const corpusOption = process.argv.find((value) => value.startsWith("--corpus="));
  const portOption = process.argv.find((value) => value.startsWith("--port="));
  const corpusPath = corpusOption ? resolve(corpusOption.slice(9)) : new URL("../../examples/search-corpus.json", import.meta.url);
  const port = Number(portOption ? portOption.slice(7) : 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Port must be an integer between 1 and 65535.");
  const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
  if (!Array.isArray(corpus.documents)) throw new Error("Corpus must contain a documents array.");
  const server = createSearchServer(corpus.documents);
  server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, "127.0.0.1", () => console.log(`DA_NK Search API: http://127.0.0.1:${port}`));
}
