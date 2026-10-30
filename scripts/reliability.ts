// Prints the article's two numbers and a few more.
import { endToEnd } from "../src/reliability.ts";

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
console.log("per step   10 steps   20 steps");
for (const p of [0.99, 0.95, 0.9]) {
  console.log(`${pct(p).padEnd(11)}${pct(endToEnd(p, 10)).padEnd(11)}${pct(endToEnd(p, 20))}`);
}
