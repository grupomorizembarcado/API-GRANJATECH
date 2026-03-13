export function getPercentage(value, minLevel, maxLevel) {
  const distance = Number(value);
  const distFull = Number(minLevel); 
  const distEmpty = Number(maxLevel); 

  if (distEmpty <= distFull) return 0;

  let percentage = ((distEmpty - distance) / (distEmpty - distFull)) * 100;

  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;

  return percentage;
}
