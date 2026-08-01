# Upload Product

A single-page Vue 3 + Vite app for managing a product master list: bulk-upload products
from an `.xlsx` file and browse the list in a searchable, paginated table. The table can
fetch its data from a companion backend over **REST or GraphQL** (user-switchable), and
the upload posts the spreadsheet to the same backend. The backend (expected at
`http://127.0.0.1:8000`, Laravel-style API) is a separate project — this repo is the
frontend only.

> **New developer? Start with [`.docs/tldr.md`](.docs/tldr.md)** — every doc summarised on one
> page. The full guide lives in [`.docs/`](.docs/README.md).

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
| `just test` | Vitest single run (no test files exist yet — see FAQ) |
| `just claudex` | Launch Claude Code (Sonnet, all permissions) |

## Troubleshooting

### `127.0.0.1:8102` refuses to connect but the server is running

Vite binds the IPv6 loopback (`[::1]`) on this setup — use `http://localhost:8102`, not the
IPv4 literal.

### Product table is empty and the console shows "Error loading products"

The app expects its backend API at `http://127.0.0.1:8000` (hardcoded in
`src/views/HomeView.vue`). Without that backend running, the page still loads but every
REST/GraphQL fetch fails and the table stays empty. Start the companion backend project,
or expect an empty table during frontend-only work.

### `just start` window closes immediately / "Port 8102 is already in use"

The dev server runs with `--strictPort`, so it exits instead of hopping ports. Run
`just stop` to kill a lingering server from this repo, or find the squatter with
`netstat -ano | findstr :8102` and stop it.

### `just` or `node` not found after running setup.ps1

PATH changes land in new shells only. Close and reopen PowerShell, then retry. If it
persists, re-run `pwsh ./setup.ps1` and read its `[FAIL]`/`[WARN]` lines.

### `just test` exits with "No test files found"

Vitest is configured (jsdom + @vue/test-utils) but the repo has no `*.spec.js`/`*.test.js`
files yet, so a run exits 1. This is expected until unit tests are written.

More in [`.docs/06-troubleshooting/common-issues.md`](.docs/06-troubleshooting/common-issues.md).

## Project layout

```
upload-product-vue/
  index.html               # Vite entry page
  vite.config.js           # Vue + devtools + Tailwind v4 plugins, @ -> src alias
  vitest.config.js         # jsdom test env (merges vite.config.js)
  eslint.config.js         # ESLint 9 flat config (vue + vitest + prettier)
  justfile, setup.ps1      # dev recipes + machine bootstrap
  src/
    main.js                # createApp + Pinia + router + VeeValidate plugin
    App.vue                # bare <router-view />
    router/index.js        # single route: / -> HomeView
    views/HomeView.vue     # page shell: upload card + product table; all API calls
    components/
      UploadProduct.vue    # .xlsx upload form (VeeValidate rules)
      product/ProductIndex.vue  # searchable, paginated product table
    composables/useDebouncedRef.js  # 500 ms debounced customRef (search box)
    includes/validation.js # global VeeValidate plugin: rules + messages
    stores/counter.js      # Pinia scaffold store (unused)
    assets/                # Tailwind v4 entry css + base styles
  .docs/                   # developer documentation (start at tldr.md)
  .claude/                 # Claude Code skills, settings, statusline
```
