# Common Issues

> **TL;DR** Every issue below was actually hit while standing this repo up. Symptom → cause →
> fix, most frequent first. Check here before debugging from scratch.

## `http://127.0.0.1:8102` refuses to connect, but the server says it started

**Symptom.** `just start` reports `Started: http://localhost:8102`, but `curl 127.0.0.1:8102`
(or a browser pointed at the IP) gets connection refused / `curl: (7)`.

**Cause.** On this Windows/Node 24 setup, Vite's dev server binds the **IPv6 loopback only** —
`netstat -ano | findstr :8102` shows `TCP [::1]:8102 ... LISTENING`. `127.0.0.1` (IPv4) has no
listener.

**Fix.** Use `http://localhost:8102` (resolves to `::1`). If something genuinely needs IPv4,
add `--host 127.0.0.1` to the dev invocation — but don't commit that change without checking
the whole team's stack.

## Product table is empty; console logs `Error loading products: AxiosError`

**Symptom.** The page renders, the upload card and table are visible, but the table shows
"Showing 0 to 0 of 0 entries" and the browser console logs axios `ERR_NETWORK`/`ECONNREFUSED`
errors on load and on every search keystroke.

**Cause.** The companion backend at `http://127.0.0.1:8000` isn't running — the base URL is
hardcoded in `src/views/HomeView.vue` and every list/upload call needs it.

**Fix.** Start the backend project
([`dxiiren/laravel-inventory-api`](https://github.com/dxiiren/laravel-inventory-api)),
or accept the empty state for frontend-only work. This is expected behavior, not a bug in
this repo.

## `just start` window flashes and dies / "Port 8102 is already in use"

**Symptom.** The background PowerShell window opens and closes immediately; nothing listens on
8102, or Vite prints `Port 8102 is already in use`.

**Cause.** `--strictPort` makes Vite exit instead of hopping to 8103 when the port is taken —
usually a lingering server from a previous session or another app squatting the port.

**Fix.** `just stop` (kills only this repo's node processes). If it reports 0 stopped, find
the squatter: `netstat -ano | findstr :8102`, then `Stop-Process -Id <pid>` after confirming
it's yours. To debug startup output, use `just dev` (foreground) — the error stays visible.

## `just` / `node` / `uv` not recognized right after setup.ps1

**Symptom.** `setup.ps1` printed `[OK]` for a tool, but running it in the same or another
already-open shell fails with "not recognized".

**Cause.** Installers append to the registry PATH; already-open PowerShell sessions keep their
old PATH.

**Fix.** Close and reopen PowerShell. `setup.ps1` is idempotent — re-run it after reopening if
anything still fails; read its `[FAIL]`/`[WARN]` lines.

## `npm ci` warns: 25 vulnerabilities (16 high, 2 critical)

**Symptom.** `just install` finishes with a vulnerability summary and suggests `npm audit fix`.

**Cause.** Transitive pins in the committed `package-lock.json` (dev-heavy dependency tree:
Vite 6 / ESLint 9 / Vitest 3 era).

**Fix.** **Do not run `npm audit fix` or `npm update` casually** — regenerating the lockfile
is a deliberate, reviewed change, and the app is a localhost-only dev tool. Treat a real
upgrade (e.g. Vite major bump) as its own task with a full re-verify.

## `just lint` / `just format` changed files I didn't touch

**Symptom.** After running the quality recipes, `git status` shows modified files beyond your
edit.

**Cause.** Both npm scripts write by design: `lint` = `eslint . --fix`, `format` =
`prettier --write src/`. First run after a while can reformat older files.

**Fix.** That's intended — review the diff and commit formatting separately
(`style: ...`) if it's noisy. For read-only checks use `npx eslint .` /
`npx prettier --check src/`.

## Related docs

| Doc | Why |
| --- | --- |
| [`../02-setup/getting-started.md`](../02-setup/getting-started.md) | The happy path these issues deviate from |
| [`../05-reference/commands.md`](../05-reference/commands.md) | What each recipe actually runs |
| [`../07-faq/faq.md`](../07-faq/faq.md) | Conceptual questions (ports, backend, tests) |
