import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { once } from "node:events";
import { createSearchServer } from "../apps/search-api/server.mjs";

test("HTTP API serves real searches and rejects invalid requests", async (t) => {
  const corpus = JSON.parse(readFileSync(new URL("../examples/search-corpus.json", import.meta.url), "utf8"));
  const server = createSearchServer(corpus.documents);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.deepEqual(await (await fetch(`${base}/health`)).json(), { status: "ok", document_count: 2 });
  const result = await fetch(`${base}/search?q=${encodeURIComponent("2026년 1월 러시아")}`);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).results[0].document_id, "example-001");
  assert.equal((await fetch(`${base}/search`)).status, 400);
  for (const limit of ["NaN", "0", "101", "1.5"]) {
    assert.equal((await fetch(`${base}/search?q=test&limit=${limit}`)).status, 400);
  }
  assert.equal((await fetch(`${base}/missing`)).status, 404);
  assert.equal((await fetch(`${base}/search?q=test`, { method: "POST" })).status, 405);
});
