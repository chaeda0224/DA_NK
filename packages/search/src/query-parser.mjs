const DEFAULT_ALIASES = [
  ["러시아", "로씨야"],
];

const FILLER_PATTERN = /검색해줘|검색해 줘|찾아줘|찾아 줘|찾아주세요|찾아 주세요|보여줘|보여 줘|보여주세요|보여 주세요|알려줘|알려 줘|기사|자료|문헌|관련|대해|대하여|중에서|있는|있고|원하는|전체|좀|해주세요|해줘/g;

export function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactSearchText(value) {
  return normalizeSearchText(value).replace(/\s/g, "");
}

export function expandAliases(term, aliases = DEFAULT_ALIASES) {
  const normalized = normalizeSearchText(term);
  const expanded = new Set([normalized]);
  for (const group of aliases) {
    const normalizedGroup = group.map(normalizeSearchText);
    for (const current of [...expanded]) {
      for (const source of normalizedGroup) {
        if (!current.includes(source)) continue;
        for (const replacement of normalizedGroup) {
          expanded.add(current.replaceAll(source, replacement));
        }
      }
    }
  }
  return [...expanded];
}

export function parseNaturalQuery(value, { aliases = DEFAULT_ALIASES } = {}) {
  let text = normalizeSearchText(value);
  const years = [];
  const months = [];

  for (const match of text.matchAll(/((?:19|20)\d{2})\s*년(?:\s*(\d{1,2})\s*월)?/g)) {
    years.push(match[1]);
    if (match[2]) months.push(`${match[1]}-${match[2].padStart(2, "0")}`);
  }

  text = text
    .replace(/((?:19|20)\d{2})\s*년(?:\s*\d{1,2}\s*월)?/g, " ")
    .replace(FILLER_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    raw: String(value ?? ""),
    terms: text ? [expandAliases(text, aliases)] : [],
    filters: {
      years: [...new Set(years)],
      months: [...new Set(months)],
    },
  };
}
