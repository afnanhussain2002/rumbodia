/**
 * Enter on a line that starts with "N." continues the list with "N+1. ".
 * Enter on an empty "N. " line ends the list (removes the marker).
 * Returns null when the default Enter behavior should apply.
 */
export function continueNumberedList(
  value: string,
  caret: number,
): { value: string; caret: number } | null {
  const lineStart = value.lastIndexOf("\n", caret - 1) + 1;
  const lineEndIdx = value.indexOf("\n", caret);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
  const line = value.slice(lineStart, lineEnd);
  const match = /^(\s*)(\d+)\.\s?(.*)$/.exec(line);
  if (!match) return null;

  const [, indent = "", num = "1", rest = ""] = match;
  if (!rest.trim() && caret === lineEnd) {
    // Empty item: end the list.
    const next = value.slice(0, lineStart) + value.slice(lineEnd);
    return { value: next, caret: lineStart };
  }
  const insert = `\n${indent}${Number(num) + 1}. `;
  return { value: value.slice(0, caret) + insert + value.slice(caret), caret: caret + insert.length };
}
