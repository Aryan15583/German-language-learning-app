/** Index that changes once per day, for "of the day" content. */
export const dailyIndex = (n: number) => Math.floor(Date.now() / 864e5) % n;

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
