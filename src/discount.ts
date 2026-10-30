// The function the agent returns in the article, unchanged.
export type CartItem = { price: number; quantity: number };

export function applyDiscount(items: CartItem[], discountPct: number): number {
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  return subtotal * (1 - discountPct / 100);
}
