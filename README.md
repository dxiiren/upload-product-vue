# Vue Inventory UI

A single-page Vue 3 + Vite app for managing a product master list: bulk-upload products
from an `.xlsx` file and browse the list in a searchable, paginated table. The table can
fetch its data from a companion backend over **REST or GraphQL** (user-switchable), and
the upload posts the spreadsheet to the same backend. This repo is the frontend only —
the backend is a separate project (see [Backend](#backend) below).

![Vue Inventory UI app — upload card and product table](docs/images/app.png)

*The app running on `http://localhost:8102` without the backend: the table falls back to a
built-in demo catalogue and a dismissible banner explains how to go live. Start the backend
to see real data.*

> **New developer? Start with [`.docs/tldr.md`](.docs/tldr.md)** — every doc summarised on one
> page. The full guide lives in [`.docs/`](.docs/README.md).

## Backend

This UI talks to
**[laravel-inventory-api](https://github.com/dxiiren/laravel-inventory-api)** —
a Laravel API that imports the uploaded spreadsheet via Laravel Excel and serves the
product list over both REST and GraphQL. It also has features this UI does not surface
yet: a per-upload **import report** (row-level accepted/rejected results) and **idempotent
imports** (re-uploading the same file won't duplicate rows).

The base URL is hardcoded as `http://127.0.0.1:8000` in `src/views/HomeView.vue`
(`const baseURL`), and three endpoints are used:

| Endpoint | Used for |
| --- | --- |
| `POST /api/products/import` | `.xlsx` upload (multipart form, field `file`) |
| `GET /api/products?page=N&search=…` | product list, REST mode |
| `POST /api/graphql` | product list, GraphQL mode (`products` query) |

Without the backend running, the app falls back to **demo data**: a static catalogue of six
sample products (`src/data/demoProducts.js`) renders in the table and a dismissible banner
links to the backend repo (see Troubleshooting).

## Prerequisites

| Tool | Version | Installed by |
| --- | --- | --- |
| PowerShell + winget | Windows 10/11 stock | — (the only true prerequisites) |
| Git | any recent | `setup.ps1` (winget) |
| Node.js | LTS (verified on v24) | `setup.ps1` (winget) |
| just | any recent | `setup.ps1` |
| Claude Code CLI | latest | `setup.ps1` (optional, for AI-assisted dev) |

## Quick start

```powershell
# 1. One-time machine setup (idempotent — safe to re-run)
pwsh ./setup.ps1

# 2. Close and reopen PowerShell so PATH updates land

# 3. Install dependencies (npm ci from the lockfile)
just install

# 4. Start the dev server
just start
```

The app is now at **http://localhost:8102**. Stop it with `just stop`.
(Use `localhost`, not `127.0.0.1` — Vite binds the IPv6 loopback `[::1]` here.)

## Commands

Run `just` with no arguments to list every recipe. The ones you'll use daily:

| Command | What it does |
| --- | --- |
| `just install` | Install dependencies (`npm ci`) |
| `just start` | Dev server on :8102 in a background window |
| `just dev` | Dev server in the foreground (Ctrl+C to stop) |
| `just stop` | Stop only THIS repo's node processes |
| `just build` | Production build to `dist/` |
| `just preview` | Serve the production build on :8102 |
| `just lint` | ESLint with auto-fix (`eslint . --fix`) |
| `just format` | Prettier write on `src/` |
| `just test` | Vitest single run (`vitest --run`) |
| `just claudex` | Launch Claude Code (Sonnet, all permissions) |

## Testing

Unit tests run with **Vitest 3** (jsdom + `@vue/test-utils`), configured in
`vitest.config.js` (merges `vite.config.js`, so the `@` → `src/` alias works in specs).

```powershell
just test              # single run (vitest --run)
just test HomeView     # pass-through filter: only specs matching "HomeView"
npm run test:unit      # watch mode
```

Specs live next to the code they cover — **81 tests across 5 files**. No backend is
needed: all HTTP is mocked with `vi.mock('axios')`.

| Spec | Covers |
| --- | --- |
| `src/views/__tests__/HomeView.spec.js` | GraphQL fetch on mount, the REST switch, search wiring (`?search=` for REST vs `variables.filter.search` for GraphQL), the `prevPage`/`nextPage` boundary guards, the demo-data fallback on **both** transports, and the import happy/sad paths |
| `src/components/product/__tests__/ProductIndex.spec.js` | Guarded pagination summary (no `NaN`), page-offset row numbering, empty state, loading skeleton, the 500 ms debounced search, the API-type switch, and the Previous/Next disabled states |
| `src/components/__tests__/UploadProduct.spec.js` | The `required` + `excluded` MIME rules (mounted with the real VeeValidate plugin) and the `uploadProducts` emit |
| `src/composables/__tests__/useDebouncedRef.spec.js` | Trailing-edge debounce, timer reset on rapid sets, custom/default delays |
| `src/data/__tests__/demoProducts.spec.js` | Case-insensitive search across all fields, page clamping, and the paginator shape contract shared with the REST/GraphQL adapters |

## Troubleshooting

### `127.0.0.1:8102` refuses to connect but the server is running

Vite binds the IPv6 loopback (`[::1]`) on this setup — use `http://localhost:8102`, not the
IPv4 literal.

### Table shows demo rows and a "Demo data" banner

The app expects its backend API at `http://127.0.0.1:8000` (hardcoded in
`src/views/HomeView.vue`). When that backend is unreachable, every REST/GraphQL fetch
fails and the app serves a static demo catalogue instead, with a banner linking to
[laravel-inventory-api](https://github.com/dxiiren/laravel-inventory-api). Start the
backend and reload (or switch API type) to fetch live data — the demo fallback and
banner are expected during frontend-only work.

### `just start` window closes immediately / "Port 8102 is already in use"

The dev server runs with `--strictPort`, so it exits instead of hopping ports. Run
`just stop` to kill a lingering server from this repo, or find the squatter with
`netstat -ano | findstr :8102` and stop it.

### `just` or `node` not found after running setup.ps1

PATH changes land in new shells only. Close and reopen PowerShell, then retry. If it
persists, re-run `pwsh ./setup.ps1` and read its `[FAIL]`/`[WARN]` lines.

More in [`.docs/06-troubleshooting/common-issues.md`](.docs/06-troubleshooting/common-issues.md).

## Project layout

```
vue-inventory-ui/
  index.html               # Vite entry page
  vite.config.js           # Vue + devtools + Tailwind v4 plugins, @ -> src alias
  vitest.config.js         # jsdom test env (merges vite.config.js)
  eslint.config.js         # ESLint 9 flat config (vue + vitest + prettier)
  justfile, setup.ps1      # dev recipes + machine bootstrap
  src/
    main.js                # createApp + Pinia + router + VeeValidate plugin
    App.vue                # bare <router-view />
    router/index.js        # single route: / -> HomeView
    views/HomeView.vue     # page shell: upload card + demo banner + table; all API calls
    views/__tests__/HomeView.spec.js  # Vitest spec (mocked axios; render + endpoints + fallback)
    components/
      UploadProduct.vue    # .xlsx upload form (VeeValidate rules)
      __tests__/UploadProduct.spec.js  # MIME rules + uploadProducts emit
      product/ProductIndex.vue  # searchable, paginated product table (skeleton + empty state)
      product/__tests__/ProductIndex.spec.js  # pagination guard, search debounce, empty state, skeleton
    data/demoProducts.js   # static demo catalogue + mock adapter (backend-down fallback)
    data/__tests__/demoProducts.spec.js  # search, page clamping, paginator shape contract
    composables/useDebouncedRef.js  # 500 ms debounced customRef (search box)
    composables/__tests__/useDebouncedRef.spec.js  # trailing-edge debounce semantics
    includes/validation.js # global VeeValidate plugin: rules + messages
    stores/counter.js      # Pinia scaffold store (unused)
    assets/                # Tailwind v4 entry css + base styles
  docs/images/             # README assets (app screenshot)
  .docs/                   # developer documentation (start at tldr.md)
  .claude/                 # Claude Code skills, settings, statusline
```
