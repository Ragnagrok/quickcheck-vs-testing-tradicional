// Compound reliability: if each step succeeds with probability p, independently,
// a workflow of n steps succeeds end to end with probability p^n.
export const endToEnd = (p: number, steps: number): number => p ** steps;
