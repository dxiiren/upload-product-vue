---
name: pre-pr-review
description: Use when the developer says 'pre-pr review', 'review my branch', 'audit my work', or 'self review' — self-reviews the current branch's diff against a Vue 3 / Tailwind / accessibility checklist before opening a PR, then saves a report to .claude/workspace/reports/pr/.
model: opus
---

# Pre-PR Review (Self-Audit)

Self-review your feature-branch diff **before** opening a PR. This is a single-stack
(Vue 3 / Vite / Tailwind v4, plain JS) frontend SPA — there is no backend code in this repo.
The goal is to catch reactivity, a11y, and API-contract problems early, not to nitpick style
that `/lint-check` already handles.

## Trigger

- `"pre-pr review"` / `"self review"`
- `"review my branch"` / `"review my work"` / `"review my code"`
- `"audit my work"` / `"audit my branch"`

## Do NOT flag (owned by other tools — see CLAUDE.md)

- **Formatting** — Prettier (`npm run format`) owns it.
- **Lint rules** — ESLint (`npx eslint .`) owns it.
- Pre-existing patterns the developer copied from the codebase — not this branch's problem.

> Note: this repo has NO pre-commit hooks and NO CI — nothing runs those tools automatically,
> so start by running `/lint-check` and treat its failures as blocking issues.

## Step 1 — Branch & base

```bash
git branch --show-current
```

If on `main`: **STOP** — "You're on `main`; switch to your feature branch first."

```bash
git fetch origin main
git diff origin/main...HEAD --name-only
```

If no files changed: **STOP** — "No changes vs `main`."

Scope the review to reviewable source: `**/*.vue`, `**/*.js` (composables, `includes/`,
`stores/`, `router/`), `**/*.css`, `vite.config.js`, `vitest.config.js`. **Exclude**
`package-lock.json` and `.claude/`. If only excluded files changed: **STOP** — "No
reviewable source changed."

Report: "Branch `{name}` changed {N} source files ({vue} .vue, {js} .js). Running FE review."

## Step 2 — Fetch the diff

```bash
git diff origin/main...HEAD -- '*.vue' '*.js' '*.css'
```

For context-dependent checks (composable cleanup, emitted-event contracts, the API shapes in
`HomeView.vue`), read the **full file**, not just the hunk. If the diff exceeds ~4000 lines,
prioritise the highest-change files and note "focused review on largest files".

## Step 3 — Run the checklist

Verify each finding against the actual code before reporting it (grep how existing components
do the same thing; don't invent a rule the codebase doesn't follow).

| #   | Check                      | Label      | What to look for                                                                                                                                                                                                                                                                        |
| --- | -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Accessibility**          | issue      | Interactive `<div>`/`<span>` with `@click` instead of `<button>`/`<router-link>`; icon-only buttons without `aria-label`; `<img>` without meaningful `alt`; inputs without an associated `<label for>` (the existing search/API-type fields set the pattern); heading order (no jumps). |
| 2   | **Semantic HTML**          | issue      | Landmarks where the page grows (`<main>`, `<header>`); one `<h1>` per page; lists as `<ul>/<ol>`; data tables keep `<thead>/<tbody>` + header cells as `<th>`.                                                                                                                          |
| 3   | **Reactivity**             | issue      | Destructuring `props` or a `reactive()` object (loses reactivity — use `toRef`/`toRefs` or keep `props.x`); mutating a prop; `ref` read/written without `.value` in `<script>`; `computed` vs method chosen wrong; `v-model` on a prop.                                                  |
| 4   | **`v-for` keys**           | issue      | Missing `:key`, `:key="index"` on a list that reorders/filters (the product table filters — keys must be `item.id`), or `v-if` on the same element as `v-for`.                                                                                                                          |
| 5   | **Composable correctness** | issue      | Missing cleanup (`onUnmounted` / `onScopeDispose`) for listeners, intervals, observers; `useDebouncedRef`-style timers cleared on dispose; composables returning raw values where callers expect refs.                                                                                   |
| 6   | **API contract**           | issue      | REST and GraphQL paths in `HomeView.vue` must both normalize to the same paginator shape (`data`, `current_page`, `last_page`, `total`, `per_page`); errors caught and surfaced (not swallowed silently); query params encoded (`encodeURIComponent` on user search input).              |
| 7   | **Forms / validation**     | issue      | New fields wired through the VeeValidate plugin (`src/includes/validation.js`) with rules + a message, not ad-hoc `if` checks; `ErrorMessage` rendered for every validated field; file-type restrictions consistent between the `accept` attr and the validation rule.                   |
| 8   | **Security**               | issue      | No `v-html` with untrusted content (XSS); no hardcoded credentials/tokens; uploaded-file handling stays client-side (the backend validates content); nothing secret in committed config.                                                                                                 |
| 9   | **No debug leftovers**     | issue      | `console.log` / `console.debug` / `debugger` / commented-out dead blocks / `TODO` without a follow-up. (Existing `console.error` in catch blocks is the established pattern — keep, don't multiply.)                                                                                     |
| 10  | **Tests**                  | suggestion | Vitest is configured but the repo has no specs yet — for new logic-bearing code (composables, data mappers), suggest a first `*.spec.js` under `src/` rather than growing the untested surface.                                                                                          |
| 11  | **Component design**       | suggestion | `defineProps`/`defineEmits` declared for every prop/event used; oversized components worth splitting; API-fetch logic accumulating in `HomeView.vue` that belongs in a composable.                                                                                                       |
| 12  | **Tailwind hygiene**       | nitpick    | Conflicting/duplicate utilities on one element; arbitrary values (`w-[137px]`) where a scale token exists; copy-pasted class strings that should be a shared component; responsive/state variant order.                                                                                  |

## Step 4 — Quality gate

Run `/lint-check` (ESLint read-only + Prettier check). Any failure is a blocking **issue**.
If specs exist by now, also run `just test` and report the result.

## Step 5 — Finding labels & caps

- **issue** (blocking) — fix before opening the PR.
- **suggestion** (non-blocking) — recommended.
- **nitpick** (non-blocking) — minor/optional.

Every finding must carry: the label, the `file:line`, and **WHY** it matters (not just what).
Issues: uncapped. Suggestions + nitpicks: cap at 15 total; note "{X} more non-blocking findings
omitted" if over.

## Step 6 — Present

```
## Pre-PR Review: {branch}
Branch: {branch} -> main   |   Files: {N} ({vue} .vue, {js} .js)
Quality gate: {lint/format pass/fail}

### Issues (fix before PR)
1. [path:line] Finding — why it matters

### Suggestions
2. [path:line] Finding

### Nitpicks
3. [path:line] Finding

---
{Total} findings: {issues} issues, {suggestions} suggestions, {nitpicks} nitpicks
```

Zero findings → "No issues found — branch looks clean. Ready to open the PR."

## Step 7 — Save the report

Path: `.claude/workspace/reports/pr/{branch}-{YYYY-MM-DD}.md` (replace `/` in the branch name
with `-`; overwrite on a same-day re-run; create the folder if missing — it is git-ignored).
Frontmatter then the same body as the terminal output:

```yaml
---
branch: { branch }
base: main
date: { YYYY-MM-DD }
files_changed: { N }
issues: { count }
suggestions: { count }
nitpicks: { count }
---
```

Confirm: "Report saved to `{path}`".

## Tone

Self-improvement, not a verdict from a lead. "Consider extracting…", not "You must fix…". Never
directive, never judgmental.
