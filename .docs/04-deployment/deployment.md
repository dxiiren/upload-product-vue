# Deployment

> **TL;DR** There is no deployment. No CI/CD, no hosting target, no environments — this app
> runs locally via `just start`. This page records that honestly and sketches what shipping it
> would take, so nobody goes hunting for a pipeline that doesn't exist.

## Current status

| Question | Answer |
| --- | --- |
| CI (lint/test on push)? | **None.** No `.github/workflows/`, no other CI config. Quality checks are manual (`just lint`). |
| CD / hosting? | **None.** The app is served by the Vite dev server on `http://localhost:8102`. |
| Environments / secrets? | **None.** No `.env` files; the only "config" is the hardcoded backend URL in `src/views/HomeView.vue`. |
| Docker? | **None.** |

## What a production build produces

```powershell
just build      # vite build  ->  dist/
just preview    # serve dist/ on http://localhost:8102 to sanity-check it
```

`dist/` is a fully static bundle (HTML + hashed JS/CSS assets) — `dist/` is git-ignored and
regenerated at will.

## If this ever needs to ship

Prerequisites before any real deployment, in order:

1. **Make the API base URL configurable** — replace the `baseURL` const in
   `src/views/HomeView.vue` with `import.meta.env.VITE_API_BASE_URL` (plus a `.env.example`).
   A production frontend pointing at `127.0.0.1:8000` is useless.
2. **CORS / same-origin plan** — the backend must allow the frontend's origin, or the static
   bundle must be served behind the same host as the API.
3. **SPA fallback** — Vue Router uses history mode; any static host must rewrite unknown paths
   to `index.html`.
4. **A CI gate** — at minimum `npx eslint .` + `vite build` on PR, plus `vitest run` once
   specs exist.

Any static host (nginx, GitHub Pages, Netlify, a Laravel `public/` folder) can then serve
`dist/`.

## Related docs

| Doc | Why |
| --- | --- |
| [`../02-setup/getting-started.md`](../02-setup/getting-started.md) | The local "deployment" that does exist |
| [`../05-reference/commands.md`](../05-reference/commands.md) | `build` / `preview` recipes |
| [`../01-overview/architecture.md`](../01-overview/architecture.md) | Where the hardcoded base URL lives |
