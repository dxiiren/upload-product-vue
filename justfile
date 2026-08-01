# Upload Product justfile — development recipes

set shell := ["powershell.exe", "-NoProfile", "-Command"]

port := env_var_or_default('PORT', '8102')

# List available recipes
default:
    @just --list

# ─── Guards ───────────────────────────────────────────────

# Node/npm — installed by setup.ps1; needed by every recipe here.
[private]
_require-node:
    @if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Write-Error "Node/npm not found on PATH.`n  -> Run setup.ps1 first:  pwsh ./setup.ps1"; exit 1 }

# ─── App lifecycle ───────────────────────────────────────

# Install dependencies (npm ci when the lockfile allows, else npm install).
install: _require-node
    if (Test-Path package-lock.json) { npm ci } else { npm install }

# Start the dev server on http://localhost:{{port}} (background window).
# Runs `stop` first so a previous run's server doesn't linger. The dev server's node
# process carries this repo's node_modules path on its command line — that's how
# `stop` scopes the kill to THIS project.
start: _require-node stop
    Start-Process powershell -ArgumentList "-NoProfile", "-Command", "cd '{{justfile_directory()}}'; npm run dev -- --port {{port}} --strictPort"
    Start-Sleep -Seconds 2
    Write-Host "Started: http://localhost:{{port}}  (stop with: just stop)"

# Dev server in the FOREGROUND (Ctrl+C to stop).
dev: _require-node
    npm run dev -- --port {{port}} --strictPort

# Stop only THIS project's node.exe processes, not every node on the box.
# Matches node whose command line contains this repo's path (trailing '\').
stop:
    $procs = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like '*{{justfile_directory()}}\*' }); $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Write-Host "Stopped $($procs.Count) project node.exe process(es)"

# Production build.
build: _require-node
    npm run build

# Preview the production build.
preview: _require-node
    npm run preview -- --port {{port}}

# ─── Quality ─────────────────────────────────────────────

# Lint the codebase (eslint . --fix — fixes in place).
lint: _require-node
    npm run lint

# Format src/ with Prettier (writes in place).
format: _require-node
    npm run format

# Run unit tests once (vitest run). NOTE: no test files exist yet — vitest
# exits 1 with "No test files found" until specs are added.
test *flags: _require-node
    npm run test:unit -- --run {{flags}}

# ─── Tools ───────────────────────────────────────────────

# Launch Claude Code with all permissions — Sonnet (latest)
claudex:
    claude --dangerously-skip-permissions --model sonnet

# Launch Claude Code with all permissions — Opus (latest)
claudeo:
    claude --dangerously-skip-permissions --model opus

# Launch Claude Code with all permissions — Haiku (latest)
claudeh:
    claude --dangerously-skip-permissions --model haiku
