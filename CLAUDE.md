# CLAUDE.md — vue-inventory-ui

> Human-facing developer docs live in [`.docs/`](./.docs/README.md) — start at
> [`.docs/tldr.md`](./.docs/tldr.md). Keep them in sync when changing behavior they document.

## Project: Vue Inventory UI

A single-page Vue 3 + Vite frontend for a product master list: bulk-upload products from an
`.xlsx` file and browse them in a searchable, paginated table that can fetch from a companion
backend (expected at `http://127.0.0.1:8000`) over REST **or** GraphQL — the user switches the
API type in the UI. Frontend only; without the backend the app falls back to a static demo
catalogue (`src/data/demoProducts.js`) plus a dismissible "Demo data" banner.

- **Repo:** GitHub — `github.com/dxiiren/vue-inventory-ui`
- **Runs locally only** — no CI/CD, no deployment target. `just start` serves on
  `http://localhost:8102`.

### Tech Stack Quick Reference

| Layer | Technology | Key details |
| --- | --- | --- |
| Framework | **Vue 3.5** (`<script setup>`, Composition API) | SPA; Vue Router 4 history mode, single route `/` |
| Build | **Vite 6** | `@vitejs/plugin-vue`, `vite-plugin-vue-devtools`, `@` alias → `src/` |
| Styling | **Tailwind CSS v4** | via `@tailwindcss/vite` plugin — no tailwind.config file |
| Forms | **VeeValidate 4** + `@vee-validate/rules` | global plugin `src/includes/validation.js`; upload rules `required` + `excluded` MIME |
| HTTP | **axios** (+ raw GraphQL POST) | all calls in `src/views/HomeView.vue`; base URL hardcoded `http://127.0.0.1:8000` |
| State | **Pinia 3** | installed; only the scaffold `counter` store exists (unused by pages) |
| Tests | **Vitest 3** + jsdom + @vue/test-utils | configured in `vitest.config.js`; specs in `src/**/__tests__/*.spec.js` (mocked axios, no backend needed) |
| Quality | ESLint 9 flat config + Prettier 3 | `npm run lint` auto-fixes; `npm run format` writes `src/` |
| Package manager | **npm** | Node LTS (verified on v24); `package-lock.json` committed |
| Task runner | `just` | wraps npm scripts (`justfile`), port 8102 `--strictPort` |

### Project Structure

```
vue-inventory-ui/
  index.html, vite.config.js, vitest.config.js, eslint.config.js
  src/
    main.js                 # createApp + Pinia + router + VeeValidate plugin
    App.vue                 # bare <router-view />
    router/index.js         # single route: / -> HomeView
    views/HomeView.vue      # page shell + ALL API calls (REST + GraphQL + upload)
    views/__tests__/HomeView.spec.js      # Vitest spec (mocked axios)
    components/UploadProduct.vue          # .xlsx upload form
    components/product/ProductIndex.vue   # searchable paginated table
    composables/useDebouncedRef.js        # 500 ms debounced customRef
    includes/validation.js  # VeeValidate rules + friendly messages
    stores/counter.js       # Pinia scaffold (unused)
    assets/                 # Tailwind v4 entry css
  .docs/                    # numbered documentation set
  .claude/                  # skills, settings, statusline
```

## Git Commits

- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:` ...).
- **NEVER** add `Co-Authored-By` lines or "Generated with Claude Code" / session-link footers to
  **any** outward artifact — commit messages, PR descriptions, or issue comments.
- Commit author email for this repo is `mohdakmal875@gmail.com` (set repo-locally).
- Only stage and commit files relevant to the change. **Never auto-commit** after a fix — the
  developer says "commit" first.

## Local Development

- One-time machine setup: `pwsh ./setup.ps1` (idempotent — installs Git, Node.js LTS,
  just, the Claude Code CLI). Then `just install`, then `just start`.
- All day-2 commands are `just` recipes — run `just` to list them. Never invent an alternative
  command for something a recipe already covers.
- `just stop` kills only THIS repo's server processes (matched by repo path on the command
  line) — safe to run while other projects are serving.
- The product table needs the companion backend on `http://127.0.0.1:8000`
  ([`github.com/dxiiren/laravel-inventory-api`](https://github.com/dxiiren/laravel-inventory-api) —
  `/api/products`, `/api/graphql`, `/api/products/import`). Without it the page serves the
  static demo catalogue with a "Demo data" banner and console fetch warnings — that is
  expected during frontend-only work.
- Serve ONLY on port 8102 (`--strictPort`) — if the port is taken the dev server exits rather
  than hopping; run `just stop` first.
- `npm run lint` is `eslint . --fix` (it EDITS files); `just test` runs `vitest --run` over
  the specs in `src/**/__tests__/` — keep it green before committing.

## Project Skills

Development skills live in `.claude/skills/` — check `.claude/skills/README.md` for the catalog
and **follow the relevant skill before writing code**. Notables: `/commit`, `/create-pr`,
`/pre-pr-review`, `/lint-check`, `/claude-transfer`, `/llm-transfer`, `/define-goal`,
`/setup-mcp`, `/test-all-mcp`, `/audit-skills`.

## MCP Servers

Wired via the committed-stub + git-ignored-secret pattern: `.mcp.json.stub` (committed,
placeholders) → `.mcp.json` (git-ignored, real — seeded by `setup.ps1`). Turnkey: `context7`
(library docs — call `resolve-library-id` then `query-docs` instead of recalling APIs),
`playwright` (drive a real browser). Per-dev: `github` (fill the PAT in `.mcp.json`).
Health check: `/test-all-mcp`. Fall back to native tools silently if a server is unavailable.

## Memory

Lightweight, single-developer, file-based project memory at `.claude/memory/`:

- **`MEMORY.md`** is the index (one line per memory: `- [Title](file.md) — hook`), loaded each
  session.
- Each memory is **one fact in its own `*.md` file** with frontmatter (`name`, `description`,
  `metadata.type` = `reference` | `feedback` | `project`). Read the fact file on demand when its
  index hook is relevant.
- After writing a fact file, add its one-line pointer to `MEMORY.md`. Update rather than
  duplicate; delete a memory that turns out wrong. Don't store what the repo already records.
