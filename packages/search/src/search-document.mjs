import { normalizeSearchText } from "./query-parser.mjs";

function textForSegment(documentPackage, segment) {
  if (segment.kind === "title") return documentPackage.document.title;
  const version = documentPackage.text_versions.find((item) => item.text_version_id === segment.text_version_id);
  return version?.content ?? "";
}

export function createSearchDocument(documentPackage) {
  const document = documentPackage.document;
  const sourceRefs = documentPackage.provenance?.source_refs ?? [];
  const segments = (documentPackage.segments ?? [])
    .map((segment) => ({
      segment_id: segment.segment_id,
      kind: segment.kind,
      page: segment.page ?? document.page ?? null,
      text: textForSegment(documentPackage, segment),
    }))
    .filter((segment) => normalizeSearchText(segment.text));

  return {
    document_id: document.document_id,
    dataset_id: documentPackage.dataset_id,
    document_type: document.document_type,
    title: document.title,
    publication: document.publication ?? null,
    date: document.date ?? null,
    metadata: {
      issue_id: document.issue_id ?? null,
      page: document.page ?? null,
      category: document.category ?? null,
      verification_status: document.verification_status ?? null,
    },
    source_refs: sourceRefs,
    segments,
  };
}
