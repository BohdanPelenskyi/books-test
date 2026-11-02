const FEW_MAX = 4;
const MANY_MIN = 5;
const TEEN_MIN = 11;
const TEEN_MAX = 14;

/** Picks the Ukrainian plural form: one (1 книга), few (2 книги), many (5 книг). */
export function pluralize(
  count: number,
  [one, few, many]: readonly [string, string, string],
): string {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= TEEN_MIN && lastTwoDigits <= TEEN_MAX) return many;
  if (lastDigit === 1) return one;
  if (lastDigit >= 2 && lastDigit <= FEW_MAX) return few;
  return lastDigit === 0 || lastDigit >= MANY_MIN ? many : one;
}
