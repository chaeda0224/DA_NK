import { compactSearchText, normalizeSearchText, parseNaturalQuery } from "./query-parser.mjs";

function matchesAny(value, alternatives) {
  const normalized = normalizeSearchText(value);
  const compact = normalized.replace(/\s/g, "");
  return alternatives.some((term) => normalized.includes(term) || compact.includes(compactSearchText(term)));
}

function snippet(text, alternatives) {
  const source = String(text ?? "").replace(/\s+/g, " ").trim();
  const normalized = normalizeSearchText(source);
  const matched = alternatives.find((term) => normalized.includes(term)) ?? alternatives[0];
  if (!matched) return source.slice(0, 240);
  const position = Math.max(0, normalized.indexOf(matched) - 70);
  return `${position ? "…" : ""}${source.slice(position, position + 260)}${position + 260 < source.length ? "…" : ""}`;
}

function scoreSegment(segment, termGroups) {
  let score = segment.kind === "title" ? 12 : 0;
  for (const alternatives of termGroups) {
    if (!matchesAny(segment.text, alternatives)) return -1;
    score += segment.kind === "title" ? 12 : 4;
  }
  return score;
}

export class LocalSearchEngine {
  #documents;

  constructor(documents = []) {
    this.#documents = documents;
  }

  replaceDocuments(documents) {
    this.#documents = documents;
  }

  search(query, { datasetIds = [], documentTypes = [], limit = 20 } = {}) {
    const parsed = parseNaturalQuery(query);
    const results = [];

    for (const document of this.#documents) {
      if (datasetIds.length && !datasetIds.includes(document.dataset_id)) continue;
      if (documentTypes.length && !documentTypes.includes(document.document_type)) continue;
      if (parsed.filters.years.length && !parsed.filters.years.includes(document.date?.slice(0, 4))) continue;
      if (parsed.filters.months.length && !parsed.filters.months.some((month) => document.date?.startsWith(month))) continue;

      const evidence = document.segments
        .map((segment) => ({ segment, score: scoreSegment(segment, parsed.terms) }))
        .filter(({ score }) => score >= 0)
        .sort((left, right) => right.score - left.score)[0];
      if (!evidence && parsed.terms.length) continue;

      results.push({
        document_id: document.document_id,
        dataset_id: document.dataset_id,
        document_type: document.document_type,
        title: document.title,
        date: document.date,
        metadata: document.metadata,
        source_refs: document.source_refs,
        score: evidence?.score ?? 0,
        evidence: evidence ? {
          segment_id: evidence.segment.segment_id,
          page: evidence.segment.page,
          text: snippet(evidence.segment.text, parsed.terms.flat()),
        } : null,
      });
    }

    return {
      query: parsed,
      total: results.length,
      results: results
        .sort((left, right) => right.score - left.score || String(right.date).localeCompare(String(left.date)))
        .slice(0, limit),
    };
  }
}
