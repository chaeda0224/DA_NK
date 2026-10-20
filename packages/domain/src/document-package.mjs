const DOCUMENT_ID = /^rodong-\d{4}-\d{2}-\d{2}-a\d{3}$/;
const ISSUE_ID = /^rodong-\d{4}-\d{2}-\d{2}$/;
const ABSOLUTE_WINDOWS_PATH = /^[A-Za-z]:[\\/]/;

export function validateDocumentPackage(value) {
  const errors = [];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["DocumentPackage must be an object."];
  }

  if (value.schema_version !== 1) errors.push("schema_version must be 1.");
  if (value.dataset_id !== "rodong") errors.push("dataset_id must be rodong.");

  const document = value.document;
  if (!document || typeof document !== "object") {
    errors.push("document is required.");
  } else {
    if (!DOCUMENT_ID.test(document.document_id ?? "")) errors.push("document.document_id is invalid.");
    if (!ISSUE_ID.test(document.issue_id ?? "")) errors.push("document.issue_id is invalid.");
    if (document.document_type !== "newspaper-article") errors.push("document.document_type is invalid.");
    if (document.publication !== "로동신문") errors.push("document.publication must be 로동신문.");
    if (!document.title?.trim()) errors.push("document.title is required.");
  }

  for (const [index, asset] of (value.assets ?? []).entries()) {
    if (ABSOLUTE_WINDOWS_PATH.test(asset.logical_path ?? "")) {
      errors.push(`assets[${index}].logical_path must be relative.`);
    }
    if (!/^[a-f0-9]{64}$/i.test(asset.sha256 ?? "")) {
      errors.push(`assets[${index}].sha256 is invalid.`);
    }
  }

  if (!Array.isArray(value.segments)) errors.push("segments must be an array.");
  if (!Array.isArray(value.assets)) errors.push("assets must be an array.");
  if (!Array.isArray(value.text_versions) || value.text_versions.length === 0) {
    errors.push("text_versions must contain at least one item.");
  }
  if (!value.provenance?.ingest_run_id) errors.push("provenance.ingest_run_id is required.");

  return errors;
}

export function assertDocumentPackage(value) {
  const errors = validateDocumentPackage(value);
  if (errors.length) {
    throw new Error(`Invalid DocumentPackage:\n- ${errors.join("\n- ")}`);
  }
  return value;
}
