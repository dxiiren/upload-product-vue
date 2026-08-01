# Getting Started

> **TL;DR** `pwsh ./setup.ps1` once, reopen PowerShell, `just install`, `just start`, open
> `http://localhost:8102`. An empty product table is normal unless the companion backend is
> running on `:8000`.

## 1. One-time machine setup

From the repo root in PowerShell (not cmd.exe):

```powershell
pwsh ./setup.ps1
```

The script is idempotent — safe to re-run any time. It installs (or confirms) each tool and
prints `[OK]` / `[INSTALL]` / `[FAIL]` lines:

| Step | Tool | Why |
| --- | --- | --- |
| 1 | Git | version control |
| 2 | Node.js LTS | runtime for Vite/npm (verified on v24) |
| 3 | Claude Code CLI | optional AI-assisted development |
| 4 | uv | Python runner used by `.claude` tooling |
| 5 | Python (via uv) | statusline + skill scripts |
| 6 | just | the task runner every day-2 command uses |
| 7 | GitHub CLI | `gh` for PRs |
| 8 | `.mcp.json` seed | copies `.mcp.json.stub` → git-ignored `.mcp.json` |

**Close and reopen PowerShell afterwards** — PATH additions only land in new shells.

## 2. Install dependencies

```powershell
just install
```

Runs `npm ci` against the committed `package-lock.json` (falls back to `npm install` only if
the lockfile is missing). Do not run `npm update` — lockfile changes are deliberate.

## 3. Run the app

```powershell
just start        # background window, http://localhost:8102
# or
just dev          # foreground, Ctrl+C to stop
```

The port is fixed at **8102** with `--strictPort` — if something else holds the port, the
server exits instead of hopping. `just stop` kills only this repo's node processes.

Verify: open `http://localhost:8102` (use `localhost`, not `127.0.0.1` — Vite binds the IPv6
loopback `[::1]`). You should see the "Product Master List" page with an
upload card and a table.

## 4. The companion backend (optional but needed for data)

All data comes from a separate backend project expected at `http://127.0.0.1:8000`
(`/api/products`, `/api/graphql`, `/api/products/import` — Laravel-style responses). Without
it:

- the page renders normally;
- the table shows "Showing 0 to 0 of 0 entries";
- the browser console logs `Error loading products: AxiosError ...` — expected, not a bug.

Start that backend separately if you need real data or want to exercise the upload.

## 5. IDE setup (from the original scaffold README)

- [VSCode](https://code.visualstudio.com/) + the
  [Vue - Official (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
  extension (disable Vetur if you have it) — `.vscode/extensions.json` already recommends it.
- See the [Vite Configuration Reference](https://vite.dev/config/) when touching
  `vite.config.js`.

## 6. Optional: Claude Code

`setup.ps1` seeds `.mcp.json` from the committed stub. `context7` and `playwright` MCP servers
work out of the box; for `github`, put a PAT into the git-ignored `.mcp.json` and opt in via
`.claude/settings.local.json` (see the `/setup-mcp` skill). Launch with `just claudex`.

## Related docs

| Doc | Why |
| --- | --- |
| [`../03-development/workflow.md`](../03-development/workflow.md) | What to do after it runs |
| [`../05-reference/commands.md`](../05-reference/commands.md) | Every recipe in one table |
| [`../06-troubleshooting/common-issues.md`](../06-troubleshooting/common-issues.md) | When a step above fails |
