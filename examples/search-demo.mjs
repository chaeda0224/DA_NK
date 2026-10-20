import { readFileSync } from "node:fs";
import { LocalSearchEngine } from "../packages/search/src/local-search-engine.mjs";

const corpus = JSON.parse(readFileSync(new URL("./search-corpus.json", import.meta.url), "utf8"));
const result = new LocalSearchEngine(corpus.documents).search("2026년 1월 러시아 문헌 찾아줘");
console.log(JSON.stringify(result, null, 2));
