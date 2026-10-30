// Runs the "never negative" property against the agent's function with a
// generator that covers the parameter's range, and prints fast-check's report.
import fc from "fast-check";
import { applyDiscount } from "../src/discount.ts";

try {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          price: fc.integer({ min: 0, max: 1_000_000 }),
          quantity: fc.integer({ min: 0, max: 100 }),
        })
      ),
      fc.integer({ min: -1000, max: 1000 }),
      (items, discount) => applyDiscount(items, discount) >= 0
    )
  );
  console.log("passed");
} catch (e) {
  console.log((e as Error).message);
}
