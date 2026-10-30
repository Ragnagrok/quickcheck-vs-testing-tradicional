// The same function, with the check the agent left out: a discount is a
// percentage between 0 and 100.
import type { CartItem } from "./discount.ts";

export function applyDiscount(items: CartItem[], discountPct: number): number {
  if (!(discountPct >= 0 && discountPct <= 100)) {
    throw new RangeError(`discount must be between 0 and 100, got ${discountPct}`);
  }
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  return subtotal * (1 - discountPct / 100);
}
