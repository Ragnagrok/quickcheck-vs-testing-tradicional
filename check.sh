#!/usr/bin/env bash
# Checks the article's claims: the reliability arithmetic, what its unit test
# and its three properties actually do, and what a property with a generator
# that covers the whole input range finds.
set -euo pipefail
cd "$(dirname "$0")"

[ -d node_modules ] || pnpm install --frozen-lockfile --silent

failures=0
expect() {  # expect <description> <text> <output>
  if grep -qF -- "$2" <<<"$3"; then echo "ok   $1"; else
    echo "FAIL $1: expected '$2' in:"; echo "$3"; failures=1; fi
}

pnpm exec tsc --noEmit -p tsconfig.json
echo "ok   everything typechecks"

out=$(node scripts/reliability.ts)
expect "0.95^10 is 59.9%" "95.0%      59.9%" "$out"
expect "0.9^10 is 34.9%" "90.0%      34.9%" "$out"

out=$(pnpm exec vitest run --config vitest.article.config.ts --reporter=verbose 2>&1 || true)
expect "the article's unit test passes" "✓ article/article.spec.ts > 10% off \$100 = \$90" "$out"
expect "the article's property 1 passes, so it doesn't find the bug" "✓ article/article.spec.ts > total is never negative" "$out"
expect "the article's property 2 passes" "✓ article/article.spec.ts > 0% discount is the identity" "$out"
expect "the article's property 3 errors before running" "fc.float constraints.min must be a 32-bit float" "$out"

pnpm exec vitest run --reporter=dot >/dev/null
echo "ok   the findings in test/findings.test.ts hold"

out=$(node scripts/demo.ts)
expect "with the whole range, fast-check shrinks the bug to one item of 1 at 101%" \
  'Counterexample: [[{"price":1,"quantity":1}],101]' "$out"

exit $failures
