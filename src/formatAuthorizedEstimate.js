export function parseAuthorizedEstimate(value) {
  if (value == null || value === '') return 0;
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

export function formatAuthorizedEstimate(value) {
  const amount = parseAuthorizedEstimate(value);
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
