export function getPercentage(value) {
  const numericValue = typeof value === "number" ? value : value.toNumber();
  const total = 200.0;
  return (numericValue / total) * 100;
}
