import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LocalSearchEngine } from "../packages/search/src/local-search-engine.mjs";
import { parseNaturalQuery } from "../packages/search/src/query-parser.mjs";
import { createSearchDocument } from "../packages/search/src/search-document.mjs";

const corpus = JSON.parse(readFileSync(new URL("../examples/search-corpus.json", import.meta.url), "utf8"));
test("Korean dates and Russian spelling variants preserve source evidence", () => {
  const query = parseNaturalQuery("2026년 1월 러시아 문헌 찾아줘");
  assert.deepEqual(query.filters.months, ["2026-01"]);
  assert.deepEqual(query.terms, [["러시아", "로씨야"]]);
  const response = new LocalSearchEngine(corpus.documents).search(query.raw);
  assert.equal(response.total, 1);
  assert.equal(response.results[0].evidence.page, 1);
  assert.deepEqual(response.results[0].source_refs, ["example:example-001#page=1"]);
});
test("date, dataset, type and limit filters control the result set", () => {
  const engine = new LocalSearchEngine(corpus.documents);
  assert.equal(engine.search("2025년").total, 0);
  assert.equal(engine.search("2026년", { datasetIds: ["missing"] }).total, 0);
  assert.equal(engine.search("2026년", { documentTypes: ["missing"] }).total, 0);
  const response = engine.search("2026년", { limit: 1 });
  assert.equal(response.total, 2);
  assert.equal(response.results.length, 1);
});
test("document conversion resolves a segment text version and preserves provenance", () => {
  const document = createSearchDocument({
    dataset_id: "synthetic-demo", document: { document_id: "example-003", title: "예제", page: 3 },
    segments: [{ segment_id: "body", kind: "body", text_version_id: "v1" }],
    text_versions: [{ text_version_id: "v1", content: "직접 작성한 예제 본문입니다." }],
    provenance: { source_refs: ["example:example-003#page=3"] },
  });
  assert.equal(document.segments[0].text, "직접 작성한 예제 본문입니다.");
  assert.equal(document.segments[0].page, 3);
  assert.equal(document.source_refs[0], "example:example-003#page=3");
});
