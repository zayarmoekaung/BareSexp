const stopWords = new Set([
  'a', 'an', 'and', 'the', 'for', 'to', 'of', 'in', 'on', 'with', 'from', 'into', 'about', 'this', 'that', 'these', 'those', 'latest', 'recent', 'new', 'very', 'into', 'your', 'our', 'their', 'its', 'is', 'are', 'be', 'been', 'being', 'will', 'can', 'could', 'should', 'would', 'use', 'using', 'used', 'and', 'or'
]);

export function minimizeDescription(text: string): string {
  const normalized = text
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return 'desc';
  }

  const words = normalized
    .split(' ')
    .filter((word) => word.length > 1 && !stopWords.has(word.toLowerCase()));

  if (words.length === 0) {
    return normalizeToKebabCase(normalized).slice(0, 24);
  }

  const coreWords = words.slice(0, 6).map((word) => word.toLowerCase());
  return normalizeToKebabCase(coreWords.join(' '));
}

export function minimizeFieldName(field: string): string {
  return normalizeToKebabCase(field);
}

function normalizeToKebabCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
