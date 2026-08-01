---
name: lint-check
description: Use when the developer says 'lint check', 'run lint', 'check lint', 'run the quality suite', or 'lint everything' — runs the quality layers for this repo (ESLint check, Prettier check) and reports pass/fail per layer, with the auto-fix paths (`npm run lint`, `npm run format`).
model: sonnet
---

# lint-check — Quality suite (ESLint · Prettier)

Run the quality layers this repo has and report pass/fail per layer. This is a plain-JS
Vue 3 repo: there is **no typecheck layer** (no TypeScript, no vue-tsc) and no CI — these
checks are the whole gate.

## Trigger

When the developer says any of: "lint check", "run lint", "check lint",
"run the quality suite", "lint everything".

---

## What to Do

Run each layer and record its result. Run them independently so one failure doesn't
hide the others.

**Watch the script semantics** — this repo's npm scripts WRITE by default:

| npm script | What it actually runs      | Mode        |
| ---------- | -------------------------- | ----------- |
| `lint`     | `eslint . --fix`           | auto-fixes  |
| `format`   | `prettier --write src/`    | auto-fixes  |

For a read-only check, call the tools directly with `npx`.

### 1 — ESLint

Check first (read-only), then fix if needed:

```bash
npx eslint .          # read-only check
npm run lint          # eslint . --fix  (auto-fix pass)
```

Pass = exit 0, no errors. After an auto-fix pass, re-run the read-only check and report
what `--fix` could not resolve — fix those by hand at the root cause (remove dead code /
unused imports rather than blanket-disabling rules).

### 2 — Prettier (formatting)

```bash
npx prettier --check src/    # read-only
```

Pass = "All matched files use Prettier code style!". If it lists unformatted files,
**auto-fix** and re-check:

```bash
npm run format               # prettier --write src/
npx prettier --check src/    # confirm green
```

---

## Reporting back

Report a per-layer table, then an overall verdict:

```
LAYER    TOOL                       STATUS
lint     eslint .                   PASS | FAIL (N errors)
format   prettier --check src/      PASS | FAIL (N files)  [auto-fixed -> re-checked green]
OVERALL: PASS | FAIL
```

- **format** is safe to auto-fix mechanically. After auto-fixing, always re-run the
  check and report the green result.
- **lint** — `--fix` handles the mechanical rules; anything left needs a real code fix.
  Never blanket-disable a rule or add inline `eslint-disable` to force green — fix the
  source, or raise it with the developer if the rule itself seems wrong.

---

## Notes

- Run from the **repo root** — the flat config `eslint.config.js` covers `**/*.{js,mjs,jsx,vue}`.
- ESLint is flat-config (ESLint 9): `@eslint/js` + `eslint-plugin-vue` + `@vitest/eslint-plugin`
  + `@vue/eslint-config-prettier` (Prettier conflicts are disabled in ESLint — formatting is
  Prettier's job).
- There are no pre-commit hooks in this repo — nothing runs these automatically. Run this
  skill before `/commit` on any non-trivial change.
