export function chunkContent(content: string, maxChars = 800): string[] {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return [];

  const chunks: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  const flush = () => {
    if (current.length > 0) chunks.push(current.join('\n\n'));
  };

  for (const paragraph of paragraphs) {
    const addition = (current.length > 0 ? 2 : 0) + paragraph.length;

    if (currentLen + addition > maxChars && current.length > 0) {
      flush();
      const overlap = current.length > 1 ? current[current.length - 1] : null;
      current = overlap && overlap.length < maxChars ? [overlap] : [];
      currentLen = current.length > 0 ? overlap!.length : 0;
    }

    current.push(paragraph);
    currentLen += (current.length > 1 ? 2 : 0) + paragraph.length;
  }
  flush();

  return chunks;
}
