export const SYMBOLS = ['🐱', '🍓', '🌸', '💗', '🧁', '🦋', '⭐', '🌙'];

export function buildDeck(rand: () => number = Math.random): string[] {
  const d = [...SYMBOLS, ...SYMBOLS];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
export const isMatch = (deck: string[], a: number, b: number) => a !== b && deck[a] === deck[b];
