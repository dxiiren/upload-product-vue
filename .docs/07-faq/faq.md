# FAQ

> **TL;DR** Short answers to the questions every new developer asks about this repo: ports,
> the missing backend, the demo-data fallback, unused Pinia, missing tests, and the Claude Code files.

## Why port 8102? Can I use 5173/3000?

8102 is this repo's assigned port in the multi-repo dev environment — every project gets a
unique port so several can run at once. The justfile pins it with `--strictPort` (fail fast
instead of silently hopping to another port). Don't serve on 5173/3000/8000; if you need a
temporary different port, `$env:PORT=xxxx; just dev`.

## Where is the backend?

Not in this repo. The app expects a Laravel-style API at `http://127.0.0.1:8000`
(`GET /api/products`, `POST /api/graphql`, `POST /api/products/import`). It is a separate
project — [`dxiiren/laravel-inventory-api`](https://github.com/dxiiren/laravel-inventory-api)
on GitHub — clone and run it if you need real data. The base URL is hardcoded in
`src/views/HomeView.vue`.

## The table shows sample products and a "Demo data" banner. Is the app broken?

No — that is the expected state when the `:8000` backend isn't running. Fetches fail,
`console.warn` logs them, and the app falls back to the static demo catalogue in
`src/data/demoProducts.js` with a dismissible banner linking to the backend repo. See
[`../06-troubleshooting/common-issues.md`](../06-troubleshooting/common-issues.md).

## What does the "API Type" dropdown do?

Switches the product-list data source between GraphQL (default) and REST at runtime. Both hit
the same backend and are normalized to the same paginator shape — it exists to compare the two
API styles. Switching resets search and returns to page 1.

## Why is there a Pinia `counter` store nobody uses?

It's the create-vue scaffold example, left in place. All real state lives in `HomeView.vue`.
Use the store pattern (a new file in `src/stores/`) when state needs to be shared across
routes/components; delete `counter.js` whenever a real store replaces it as the example.

## How do I run the tests?

`just test` runs Vitest once (jsdom + @vue/test-utils, mocked axios — no backend needed);
`just test HomeView` filters by spec name. Specs live in `src/**/__tests__/*.spec.js`
(currently `src/views/__tests__/HomeView.spec.js`). See the testing section in
[`../03-development/workflow.md`](../03-development/workflow.md).

## Why did upload accept my file but nothing happened?

The form validates the file client-side (required + a few excluded MIME types), POSTs it, then
`alert`s and reloads. If the backend is down the catch branch alerts "Upload failed." and logs
the error. The backend is the real validator of spreadsheet contents — this repo has no schema
for the xlsx.

## What are `.mcp.json.stub`, `.mcp.json`, and `.claude/`?

Claude Code tooling. The committed `.mcp.json.stub` holds MCP server config with placeholder
secrets; `setup.ps1` copies it to the git-ignored `.mcp.json` where you fill real values (e.g.
a GitHub PAT). `.claude/` holds committed settings + skills; `.claude/settings.local.json` and
`.claude/workspace/` are per-developer and git-ignored. Never commit `.mcp.json`.

## Is there TypeScript / should I add types?

The repo is deliberately plain JavaScript (`jsconfig.json`, no tsconfig). Keep it that way
unless the team decides to migrate wholesale — a half-TS codebase is worse than either extreme.

## How do I add a second page?

Uncomment/extend the routes array in `src/router/index.js`, add a view under `src/views/`, and
use lazy import (`component: () => import('../views/AboutView.vue')`) as the commented example
shows. Remember every static host needs an SPA fallback for history-mode routes (see
[`../04-deployment/deployment.md`](../04-deployment/deployment.md)).

## Related docs

| Doc | Why |
| --- | --- |
| [`../01-overview/project-overview.md`](../01-overview/project-overview.md) | The longer answers |
| [`../06-troubleshooting/common-issues.md`](../06-troubleshooting/common-issues.md) | Symptom-first debugging |
| [`../02-setup/getting-started.md`](../02-setup/getting-started.md) | First-run walkthrough |
