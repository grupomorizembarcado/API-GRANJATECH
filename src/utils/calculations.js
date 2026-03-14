

export function getPercentage(levelValue, minLevel, maxLevel) {
  if (!maxLevel || maxLevel <= 0) return 0;

  let percentage = (levelValue / maxLevel) * 100;

 
  if (percentage > 100) percentage = 100;
  if (percentage < 0) percentage = 0;

  return percentage;
}