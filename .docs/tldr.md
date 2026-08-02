# TL;DR — every doc in 30 seconds

One paragraph per document. Read this page top to bottom and you know where everything is.

## [01-overview/project-overview.md](01-overview/project-overview.md)

Upload Product is a single-page Vue 3 + Vite frontend for a product master list. It does two
things: upload an `.xlsx` of products to a backend (`POST /api/products/import`) and browse the
list in a searchable, paginated table. A UI dropdown switches the table's data source between
REST and GraphQL — both are served by a companion backend expected at `http://127.0.0.1:8000`,
which is a separate project. This repo is frontend-only, runs locally on port 8102, and has no
CI/CD.

## [01-overview/architecture.md](01-overview/architecture.md)

One route (`/` → `HomeView.vue`). `HomeView` owns all API calls and state; `UploadProduct.vue`
(the form) and `ProductIndex.vue` (the table) are presentational children that communicate up
via emitted events. Both REST and GraphQL responses are normalized to the same Laravel-style
paginator shape. Search is debounced 500 ms by a custom `useDebouncedRef` composable, and form
validation is VeeValidate 4 wired globally in `src/includes/validation.js`. Tailwind v4 handles
styling via the Vite plugin; Pinia is installed but effectively unused.

## [02-setup/getting-started.md](02-setup/getting-started.md)

Run `pwsh ./setup.ps1` once (installs Git, Node LTS, just, uv, Claude Code, gh — idempotent),
reopen PowerShell, then `just install` and `just start`. The app is at `http://localhost:8102`.
Expect an empty product table unless the companion backend is running on `:8000` — that is
normal for frontend-only work. VSCode + the Vue (Volar) extension is the recommended IDE setup.

## [03-development/workflow.md](03-development/workflow.md)

Branch off `main`, edit with the dev server running (`just start`, HMR does the rest), verify in
the browser, then `just lint` + `just format` before committing (there are no hooks or CI to
catch you). Conventional Commits, no attribution footers, PRs into `main`. Vitest is configured
and `just test` runs the specs in `src/**/__tests__/` (mocked axios, no backend needed) — run
it before committing.

## [04-deployment/deployment.md](04-deployment/deployment.md)

Honest status: there is no deployment. No CI/CD pipeline, no hosting target — the app runs
locally only. `just build` produces a static `dist/` bundle (verify it with `just preview`),
which could be dropped on any static host later, but the hardcoded `http://127.0.0.1:8000` API
base URL must become configurable first.

## [05-reference/commands.md](05-reference/commands.md)

The full `just` recipe table (install/start/dev/stop/build/preview/lint/format/test/claudex) and
the underlying npm scripts, with the gotchas: `start` runs `--strictPort` on 8102, `stop` only
kills node processes whose command line contains this repo's path, `lint` and `format` both
WRITE to files, and `test` runs the Vitest specs once (`vitest --run`).

## [05-reference/project-layout.md](05-reference/project-layout.md)

Annotated tree of the repo: Vite entry (`index.html`, `vite.config.js`), the `src/` layout
(views own pages and API calls, components are presentational, composables/includes hold shared
logic), and the meta folders (`.docs/`, `.claude/`, `justfile`, `setup.ps1`).

## [06-troubleshooting/common-issues.md](06-troubleshooting/common-issues.md)

The issues actually hit while standing this repo up, each with symptom → cause → fix: empty
product table with console fetch errors (backend on `:8000` not running), `--strictPort` exit
when 8102 is taken, tools not on PATH until PowerShell restarts, and the
npm-scripts-that-write surprise (`lint`/`format` modify files).

## [07-faq/faq.md](07-faq/faq.md)

Quick answers: why port 8102, where the backend lives, why the table is empty, why Pinia ships
an unused counter store, why there are no tests yet, how the REST/GraphQL toggle works, and how
`.mcp.json.stub` / `.mcp.json` relate for Claude Code users.
