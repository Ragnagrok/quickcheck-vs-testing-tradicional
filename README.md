# QuickCheck vs. Traditional Testing

Proof of concept for the article *QuickCheck vs. Traditional Testing as a Deterministic Harness
in the GenAI Era*
([English](https://blog.ragnagrok.com/en/2026-04-23-quickcheck-vs-testing-tradicional) ·
[español](https://blog.ragnagrok.com/es/2026-04-23-quickcheck-vs-testing-tradicional)):
the article's discount example in TypeScript with [fast-check](https://github.com/dubzzz/fast-check),
run exactly as written, plus the compound reliability arithmetic.

TypeScript and fast-check because that's what the article's example uses: the code here is the
article's, not a port.

## What running it showed

Running the article's code turned up three things the article gets wrong, and one thing it gets
right for a different reason than it says.

1. **Property 1 passes.** The article says the property "total is never negative" fails and finds
   a discount of 150%. It can't: its generator draws the discount from `fc.float({ min: 0, max: 100 })`,
   and with every discount between 0 and 100 the total is never negative. A hundred thousand runs
   find nothing.
2. **The counterexample it shows isn't one.** With no items and a 150% discount the function
   returns `-0`, and in JavaScript `-0 >= 0` is `true`.
3. **Property 3 doesn't run.** Since fast-check 3, `fc.float` only takes 32-bit floats as bounds,
   and `0.01` isn't one. The test throws before generating anything. `Math.fround(0.01)` fixes it.
4. **The bug is real, and a property does find it**, once the generator covers the range the
   parameter actually accepts (`discountPct: number`, so anything). With discounts from -1000 to
   1000 and prices in cents, fast-check finds it in a handful of runs and shrinks it to the
   smallest possible case:

   ```
   Property failed after 1 tests
   Counterexample: [[{"price":1,"quantity":1}],101]
   Shrunk 34 time(s)
   ```

   The same generator, with the property "never more than the subtotal", finds the other side:
   `[[{"price":1,"quantity":1}],-1]`.

The lesson is the article's, with a twist: a property is only as strong as its generator. The
generator in the article encoded the same assumption the agent made (discounts go from 0 to 100),
so it couldn't find the bug that assumption hides.

## What's here

| File | What it is |
|---|---|
| `src/discount.ts` | The agent's `applyDiscount`, as in the article. |
| `src/discount-fixed.ts` | The same function, rejecting discounts outside [0, 100]. |
| `article/article.spec.ts` | The article's unit test and three properties, verbatim except for translated test names. One of them errors, so `pnpm test` doesn't run this file; `check.sh` does. |
| `test/findings.test.ts` | Each finding above as a test, plus the properties the fixed function passes. |
| `src/reliability.ts`, `scripts/reliability.ts` | Compound reliability: `p^n`. |
| `scripts/demo.ts` | Prints fast-check's report for the bug. |
| `check.sh` | Checks all of the above. |

The compound reliability numbers, from `node scripts/reliability.ts`:

```
per step   10 steps   20 steps
99.0%      90.4%      81.8%
95.0%      59.9%      35.8%
90.0%      34.9%      12.2%
```

They assume the steps fail independently, as the article's arithmetic does.

## Running it

With Node 24 and pnpm 10:

```sh
pnpm install
./check.sh                  # everything
pnpm test                   # the findings
node scripts/demo.ts        # the failing property, as fast-check reports it
```

## What this proof of concept doesn't cover

- **The rest of the article is argument, not code**: the Stripe Minions harness, Karpathy's
  "march of nines", Böckeler's harness engineering. There's nothing here to run for those.
- **Whether 0 to 100 is the right rule.** The fix rejects anything else. A real shop might cap
  instead, or allow discounts over 100 on purpose; the property has to follow that decision.
- **Floating point and money.** The fixed function still computes in floating point. Prices in
  cents keep the generator honest, but a real implementation would round to cents too.

## Further reading

- Claessen and Hughes (2000), [*QuickCheck: A Lightweight Tool for Random Testing of Haskell
  Programs*](https://dl.acm.org/doi/10.1145/351240.351266).
- Chen et al., [*Metamorphic Testing: A New Approach for Generating Next Test Cases*](https://arxiv.org/abs/2002.12543).
