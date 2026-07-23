export function formatK(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`
  }
  return String(n)
}

// Articles store a full ISO timestamp in `date` (not just a date), so two
// articles published the same calendar day but hours apart still sort
// correctly — this formats it down to the `YYYY.MM.DD` display convention,
// discarding the time-of-day that display never needed.
export function formatArticleDate(date: string): string {
  return date.slice(0, 10).replace(/-/g, '.')
}
