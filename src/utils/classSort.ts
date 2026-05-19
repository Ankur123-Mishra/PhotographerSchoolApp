/** Pre-school / kindergarten display order (before numeric grades). */
const PRESCHOOL_ORDER: Record<string, number> = {
  'pre-nursery': -2,
  prenursery: -2,
  playgroup: -1,
  nursery: 0,
  kg: 0.5,
  lkg: 1,
  lowerkg: 1,
  ukg: 2,
  upperkg: 2,
  prep: 3,
  preparatory: 3,
};

const ROMAN_NUMERALS: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
};

function romanToInt(token: string): number | null {
  const upper = token.toUpperCase().trim();
  if (ROMAN_NUMERALS[upper] != null) return ROMAN_NUMERALS[upper];
  if (!/^[IVXLCDM]+$/i.test(upper)) return null;

  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < upper.length; i++) {
    const cur = values[upper[i]];
    const next = values[upper[i + 1]];
    if (cur == null) return null;
    total += next != null && cur < next ? -cur : cur;
  }
  return total;
}

function normalizeClassName(name: string): string {
  let normalized = (name || '').trim();
  normalized = normalized.replace(/^class\s*-\s*/i, '');
  normalized = normalized.replace(/^class\s+/i, '');
  normalized = normalized.replace(/^(std|standard)\s*\.?\s*/i, '');
  return normalized.trim();
}

function parseLevelToken(token: string): number {
  const trimmed = token.trim();
  if (!trimmed) return 9999;

  const preschoolKey = trimmed.toLowerCase().replace(/\s+/g, '');
  if (PRESCHOOL_ORDER[preschoolKey] !== undefined) {
    return PRESCHOOL_ORDER[preschoolKey];
  }

  const roman = romanToInt(trimmed);
  if (roman != null) return 50 + roman;

  const leadingNumber = trimmed.match(/^(\d+)/);
  if (leadingNumber) return 50 + parseInt(leadingNumber[1], 10);

  if (/^\d+$/.test(trimmed)) return 50 + parseInt(trimmed, 10);

  if (/^[A-Z]$/i.test(trimmed)) return 50 + trimmed.toUpperCase().charCodeAt(0);

  return 500 + trimmed.toLowerCase().charCodeAt(0);
}

function parseSection(section: string): number {
  if (!section) return 0;
  const s = section.trim();

  if (/^[A-Z]$/i.test(s)) return s.toUpperCase().charCodeAt(0) - 64;

  const num = parseInt(s, 10);
  if (!Number.isNaN(num)) return num;

  const roman = romanToInt(s);
  if (roman != null) return roman;

  return 1000 + s.toLowerCase().charCodeAt(0);
}

/** Sort key: [grade level, section, name tie-breaker] */
export function getClassSortKey(name: string): [number, number, string] {
  const normalized = normalizeClassName(name);
  const parts = normalized.split(/\s*-\s*/).map((p) => p.trim()).filter(Boolean);

  const primary = parts[0] || normalized;
  const secondary = parts[1] || '';

  return [parseLevelToken(primary), parseSection(secondary), normalized.toLowerCase()];
}

export function sortClassItems<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const [levelA, sectionA, nameA] = getClassSortKey(a.name);
    const [levelB, sectionB, nameB] = getClassSortKey(b.name);

    if (levelA !== levelB) return levelA - levelB;
    if (sectionA !== sectionB) return sectionA - sectionB;
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
  });
}
