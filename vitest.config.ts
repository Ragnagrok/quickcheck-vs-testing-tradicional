import { defineConfig } from "vitest/config";

// `pnpm test` runs only test/. The article's tests, verbatim, live in article/
// and run through vitest.article.config.ts, because one of them errors.
export default defineConfig({ test: { include: ["test/**/*.test.ts"] } });
