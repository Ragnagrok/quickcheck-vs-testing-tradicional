// The article's unit test and three properties, as corrected on 2026-10-30,
// verbatim except for the test names and comments, translated.
import fc from "fast-check";
import { expect, test } from "vitest";
import { applyDiscount } from "../src/discount.ts";

test("10% off $100 = $90", () => {
  expect(applyDiscount([{ price: 100, quantity: 1 }], 10)).toBe(90);
});

// Prices in cents, and discounts of any sign and size: the parameter is a
// `number`, and nothing stops a caller from passing 150 or -20.
const carts = fc.array(fc.record({
  price: fc.integer({ min: 0, max: 1_000_000 }),
  quantity: fc.integer({ min: 0, max: 100 })
}));
const discounts = fc.integer({ min: -1000, max: 1000 });

// Property 1: the discounted total must never be negative.
test("total is never negative", () => {
  fc.assert(
    fc.property(carts, discounts, (items, discount) => applyDiscount(items, discount) >= 0)
  );
});
// Property 2: a 0% discount must return exactly the subtotal.
test("0% discount is identity", () => {
  fc.assert(
    fc.property(carts, (items) => {
      const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
      return applyDiscount(items, 0) === subtotal;
    })
  );
});
// Property 3: bigger discount ⇒ lower or equal total (monotonicity).
test("discount monotonicity", () => {
  fc.assert(
    fc.property(
      carts,
      fc.integer({ min: 0, max: 50 }),
      fc.integer({ min: 50, max: 100 }),
      (items, low, high) => applyDiscount(items, high) <= applyDiscount(items, low)
    )
  );
});
