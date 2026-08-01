# Commands Reference

> **TL;DR** Everything is a `just` recipe (run `just` to list them). `install → start → stop`
> is the daily cycle; `lint`/`format` WRITE to files; `test` fails until the first spec exists.

## just recipes

| Recipe | Underlying command | Notes |
| --- | --- | --- |
| `just` | `just --list` | list all recipes |
| `just install` | `npm ci` (lockfile) / `npm install` (fallback) | deterministic install from `package-lock.json` |
| `just start` | `npm run dev -- --port 8102 --strictPort` in a background window | runs `stop` first so a stale server never lingers; `--strictPort` = exit rather than hop ports |
| `just dev` | same, foreground | Ctrl+C to stop |
| `just stop` | kills `node.exe` whose command line contains this repo's path | project-scoped — never touches other repos' node processes |
| `just build` | `npm run build` (`vite build`) | outputs `dist/` |
| `just preview` | `npm run preview -- --port 8102` | serves the built `dist/` — run `just build` first |
| `just lint` | `npm run lint` (`eslint . --fix`) | **writes fixes to files**; read-only check: `npx eslint .` |
| `just format` | `npm run format` (`prettier --write src/`) | **writes**; read-only check: `npx prettier --check src/` |
| `just test [flags]` | `npm run test:unit -- --run [flags]` (`vitest --run`) | exits 1 with "No test files found" until specs exist; flags pass through to vitest (e.g. a filename filter) |
| `just claudex` | `claude --dangerously-skip-permissions --model sonnet` | Claude Code, full permissions |
| `just claudeo` | same, `--model opus` | |
| `just claudeh` | same, `--model haiku` | |

`PORT` is overridable per-invocation: `$env:PORT=8110; just dev` — but the standard assigned
port for this repo is **8102**; don't ship references to any other.

## npm scripts (for completeness)

| Script | Command |
| --- | --- |
| `dev` | `vite` |
| `build` | `vite build` |
| `preview` | `vite preview` |
| `test:unit` | `vitest` (watch mode when run bare in a TTY — the just recipe adds `--run`) |
| `lint` | `eslint . --fix` |
| `format` | `prettier --write src/` |

Prefer the `just` recipes — they pin the port and the run mode.

## One-time / setup commands

| Command | Purpose |
| --- | --- |
| `pwsh ./setup.ps1` | install/verify the toolchain (idempotent) |
| `gh auth login` | authenticate the GitHub CLI once |
| `npx playwright install chromium` | only if you use the Playwright MCP and the browser binary is missing |

## Related docs

| Doc | Why |
| --- | --- |
| [`project-layout.md`](project-layout.md) | Where the files these commands touch live |
| [`../02-setup/getting-started.md`](../02-setup/getting-started.md) | First-run ordering of these commands |
| [`../06-troubleshooting/common-issues.md`](../06-troubleshooting/common-issues.md) | When a command misbehaves |
