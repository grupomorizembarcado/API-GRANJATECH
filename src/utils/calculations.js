export function getPercentage(value, minLevel, maxLevel) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (maxLevel <= minLevel) return 0;
  return ((numericValue - minLevel) / (maxLevel - minLevel)) * 100;
}
