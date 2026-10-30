// The unit test and three properties as the article published them in April 2026,
// verbatim except for the test names and comments, translated. Kept as a record
// of the mistake the article corrected on 2026-10-30.
import fc from "fast-check";
import { expect, test } from "vitest";
import { applyDiscount } from "../src/discount.ts";

test("10% off $100 = $90", () => {
  expect(applyDiscount([{ price: 100, quantity: 1 }], 10)).toBe(90);
});

// Property 1: the discounted total must never be negative.
test("total is never negative", () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        price: fc.float({ min: 0, max: 10000, noNaN: true }),
        quantity: fc.integer({ min: 0, max: 100 })
      })),
      fc.float({ min: 0, max: 100, noNaN: true }),
      (items, discount) => applyDiscount(items, discount) >= 0
    )
  );
});
// Property 2: a 0% discount must return exactly the subtotal.
test("0% discount is the identity", () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        price: fc.float({ min: 0, max: 10000, noNaN: true }),
        quantity: fc.integer({ min: 0, max: 100 })
      })),
      (items) => {
        const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
        return Math.abs(applyDiscount(items, 0) - subtotal) < 0.001;
      }
    )
  );
});
// Property 3: bigger discount ⇒ smaller or equal total (monotonicity).
test("discount monotonicity", () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        price: fc.float({ min: 0.01, max: 10000, noNaN: true }),
        quantity: fc.integer({ min: 1, max: 100 })
      }), { minLength: 1 }),
      fc.float({ min: 0, max: 50, noNaN: true }),
      fc.float({ min: 50, max: 100, noNaN: true }),
      (items, low, high) => applyDiscount(items, high) <= applyDiscount(items, low)
    )
  );
});
