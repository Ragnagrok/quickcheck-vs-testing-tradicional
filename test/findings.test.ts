// What actually happens when the article's example runs. Each test states a
// finding and checks it, so `pnpm test` is green when the findings hold.
import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { applyDiscount as agents } from "../src/discount.ts";
import { applyDiscount as fixed } from "../src/discount-fixed.ts";
import { endToEnd } from "../src/reliability.ts";

const subtotal = (items: { price: number; quantity: number }[]) =>
  items.reduce((a, i) => a + i.price * i.quantity, 0);

// The article's generators.
const articleItems = fc.array(
  fc.record({
    price: fc.float({ min: 0, max: 10000, noNaN: true }),
    quantity: fc.integer({ min: 0, max: 100 }),
  })
);
const articleDiscount = fc.float({ min: 0, max: 100, noNaN: true });

// Prices in cents, as money usually is, and a discount from well outside the
// valid range: the parameter's type is `number`, and nothing stops a caller
// from passing 150 or -20.
const items = fc.array(
  fc.record({
    price: fc.integer({ min: 0, max: 1_000_000 }),
    quantity: fc.integer({ min: 0, max: 100 }),
  })
);
const anyDiscount = fc.integer({ min: -1000, max: 1000 });

describe("compound reliability", () => {
  test("0.95^10 ≈ 60% and 0.9^10 ≈ 35%", () => {
    expect(endToEnd(0.95, 10)).toBeCloseTo(0.599, 3);
    expect(endToEnd(0.9, 10)).toBeCloseTo(0.349, 3);
  });
  test("at 90% per step, about two runs out of three fail end to end", () => {
    expect(1 - endToEnd(0.9, 10)).toBeCloseTo(0.651, 3);
  });
});

describe("the article's example, as written", () => {
  test("the agent's function passes the unit test", () => {
    expect(agents([{ price: 100, quantity: 1 }], 10)).toBe(90);
  });

  test("property 1 does NOT find the bug: its generator never produces a discount over 100", () => {
    const result = fc.check(
      fc.property(articleItems, articleDiscount, (it, d) => agents(it, d) >= 0),
      { numRuns: 100_000 }
    );
    expect(result.failed).toBe(false);
  });

  test("the article's counterexample isn't one: no items at 150% gives -0, and -0 >= 0", () => {
    expect(Object.is(agents([], 150), -0)).toBe(true);
    expect(agents([], 150) >= 0).toBe(true);
  });

  test("property 3 can't run on fast-check 3 or later: 0.01 isn't a 32-bit float", () => {
    expect(() => fc.float({ min: 0.01, max: 10000, noNaN: true })).toThrow(
      "fc.float constraints.min must be a 32-bit float"
    );
  });
});

describe("with a generator that covers the parameter's whole range", () => {
  test("never negative: finds the bug and shrinks it to one item of 1 at 101%", () => {
    const result = fc.check(fc.property(items, anyDiscount, (it, d) => agents(it, d) >= 0));
    expect(result.failed).toBe(true);
    expect(result.counterexample).toEqual([[{ price: 1, quantity: 1 }], 101]);
  });

  test("never more than the subtotal: finds the other side, a discount of -1%", () => {
    const result = fc.check(
      fc.property(items, anyDiscount, (it, d) => agents(it, d) <= subtotal(it))
    );
    expect(result.failed).toBe(true);
    expect(result.counterexample).toEqual([[{ price: 1, quantity: 1 }], -1]);
  });
});

describe("the fixed function", () => {
  test("rejects every discount outside [0, 100]", () => {
    fc.assert(
      fc.property(
        items,
        fc.oneof(fc.integer({ max: -1 }), fc.integer({ min: 101 })),
        (it, d) => {
          expect(() => fixed(it, d)).toThrow(RangeError);
        }
      )
    );
  });

  test("inside [0, 100], the total is between 0 and the subtotal", () => {
    fc.assert(
      fc.property(items, fc.integer({ min: 0, max: 100 }), (it, d) => {
        const total = fixed(it, d);
        return total >= 0 && total <= subtotal(it);
      })
    );
  });

  test("a bigger discount never gives a bigger total (property 3, with Math.fround)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            price: fc.float({ min: Math.fround(0.01), max: 10000, noNaN: true }),
            quantity: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1 }
        ),
        fc.float({ min: 0, max: 50, noNaN: true }),
        fc.float({ min: 50, max: 100, noNaN: true }),
        (it, low, high) => fixed(it, high) <= fixed(it, low)
      )
    );
  });
});
