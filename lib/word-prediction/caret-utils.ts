/** Insert text at caret, replacing the word prefix before caret. */
export function insertAtCaret(
  value: string,
  caret: number,
  insertion: string,
  replacePrefixLength: number
): { nextValue: string; nextCaret: number } {
  const before = value.slice(0, caret - replacePrefixLength);
  const after = value.slice(caret);
  const spacer =
    after.length > 0 && !after.startsWith(" ") && !insertion.endsWith(" ")
      ? " "
      : "";
  const nextValue = `${before}${insertion}${spacer}${after}`;
  const nextCaret = before.length + insertion.length + spacer.length;
  return { nextValue, nextCaret };
}

export function currentWordPrefix(value: string, caret: number): string {
  const before = value.slice(0, caret);
  const match = before.match(/([a-zA-Z']+)$/);
  return match ? match[1] : "";
}
