import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRodongText } from "../packages/domain/src/text-normalization.mjs";

test("fullwidth digits become ASCII digits", () => {
  assert.equal(normalizeRodongText("새해 ２０２５년 １월 １일"), "새해 2025년 1월 1일");
});

test("spaces between digits are removed", () => {
  assert.equal(normalizeRodongText("20 25년, 1 0０명"), "2025년, 100명");
});

test("Korean text and punctuation are preserved", () => {
  assert.equal(normalizeRodongText("《로동신문》 기사"), "《로동신문》 기사");
});
