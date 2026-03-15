export function getPercentage(levelValue, minLevel, maxLevel) {
  if (!maxLevel || maxLevel <= minLevel) return 0;

  let percentage = ((maxLevel - levelValue) / (maxLevel - minLevel)) * 100;

  if (percentage > 100) percentage = 100;
  if (percentage < 0) percentage = 0;

  return percentage;
}