export function normalizeRodongText(value) {
  return String(value)
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/(?<=\d)\s+(?=\d)/g, "");
}
