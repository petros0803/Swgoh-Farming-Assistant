export function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export function normalizeAllyCode(value) {
  return String(value || '').replace(/-/g, '').trim();
}

export function isValidAllyCode(value) {
  const code = normalizeAllyCode(value);
  return code.length === 9 && /^\d{9}$/.test(code);
}
