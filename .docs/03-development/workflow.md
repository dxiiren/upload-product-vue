# Development Workflow

> **TL;DR** Branch off `main`, keep `just start` running (HMR), verify changes in the browser
> at :8102, run `just lint` + `just format` before every commit (nothing runs them for you),
> use Conventional Commits, PR into `main`.

## The loop

1. **Branch** — `git checkout -b feat/<slug>` off `main`. Small fixes may go straight to
   `main`; anything non-trivial goes through a PR.
2. **Serve** — `just start` (background) or `just dev` (foreground). Vite HMR applies edits
   instantly; watch the terminal for compile errors.
3. **Edit** — see the map below for where things live.
4. **Verify in the browser** — `http://localhost:8102`. For data-dependent work, run the
   companion backend on `:8000`; for pure UI work the empty-table state is fine.
5. **Quality gate (manual!)** — this repo has **no pre-commit hooks and no CI**. Before
   committing run:

   ```powershell
   just lint      # eslint . --fix  (writes fixes)
   just format    # prettier --write src/
   ```

   For a read-only check (e.g. reviewing someone else's branch): `npx eslint .` and
   `npx prettier --check src/`.
6. **Commit** — Conventional Commits (`feat(products): ...`, `fix(upload): ...`). Never add
   `Co-Authored-By` / AI-attribution footers. With Claude Code, use `/commit`.
7. **PR** — push the branch, open a PR into `main` (`gh pr create` or the `/create-pr` skill).
   Review is manual; nothing comments on the PR automatically.

## Where to make which change

| Change | File(s) |
| --- | --- |
| Table columns / row rendering / pagination UI | `src/components/product/ProductIndex.vue` |
| Upload form fields / validation rules | `src/components/UploadProduct.vue` (+ rules in `src/includes/validation.js`) |
| API endpoints, request/response mapping | `src/views/HomeView.vue` (`fetchFromRestAPI`, `fetchFromGraphQL`, `onSubmit`) |
| Backend base URL | `baseURL` const in `src/views/HomeView.vue` |
| Debounce timing / behavior | `src/composables/useDebouncedRef.js` |
| Validation messages / new global rules | `src/includes/validation.js` |
| New page / route | `src/router/index.js` + a new file in `src/views/` |
| Global styles / Tailwind entry | `src/assets/main.css`, `src/assets/base.css` |
| Build behavior, aliases, plugins | `vite.config.js` |

## Conventions in this codebase

- `<script setup>` + Composition API, plain JavaScript — do not introduce TypeScript
  piecemeal.
- Smart view / dumb components: API calls stay in `HomeView.vue` (or a future composable) —
  presentational components receive props and emit events.
- `@` alias resolves to `src/` (`vite.config.js`) — prefer it over long relative paths.
- Errors: `catch` + `console.error` is the current pattern; don't silently swallow.
- Keep both fetchers returning the normalized paginator shape
  (`data/current_page/last_page/total/per_page`) — the template depends on it.

## Testing (current state)

Vitest 3 is configured (`vitest.config.js`: jsdom env, merges the Vite config, excludes
`e2e/**`) and `@vue/test-utils` + `jsdom` are installed — but **no spec files exist yet**, so
`just test` (which runs `vitest --run`) exits 1 with "No test files found".

When adding the first tests: name them `*.spec.js` (or `*.test.js`) near the code under
`src/`, and start with the logic-bearing modules (`useDebouncedRef`, the response
normalizers). After the first spec lands, `just test` becomes a real gate — add it to step 5.

## Working with Claude Code

Skills in `.claude/skills/` encode this workflow — `/commit`, `/create-pr`, `/pre-pr-review`,
`/lint-check` are the day-2 ones. Read `.claude/skills/README.md` for the catalog.

## Related docs

| Doc | Why |
| --- | --- |
| [`../05-reference/commands.md`](../05-reference/commands.md) | The exact recipes used above |
| [`../01-overview/architecture.md`](../01-overview/architecture.md) | Understand before you edit |
| [`../06-troubleshooting/common-issues.md`](../06-troubleshooting/common-issues.md) | When the loop breaks |
