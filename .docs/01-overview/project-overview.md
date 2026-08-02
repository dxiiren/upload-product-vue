# Project Overview

> **TL;DR** Upload Product is a frontend-only Vue 3 + Vite SPA with two features: bulk-upload a
> product master list from an `.xlsx` file, and browse that list in a searchable, paginated
> table whose data source is switchable between REST and GraphQL. All data comes from a
> companion backend expected at `http://127.0.0.1:8000` (separate project, not in this repo).

## What it is

A single-page app titled "Product Master List". It exists to exercise two API styles against
the same backend and to demonstrate spreadsheet-driven bulk import from the browser.

| Feature | Where | How it works |
| --- | --- | --- |
| Bulk upload | `src/components/UploadProduct.vue` | VeeValidate form, one file field (`accept=".xlsx"`, rules `required` + `excluded` MIME types). Submits multipart to `POST /api/products/import`, alerts on success, reloads the page. |
| Product table | `src/components/product/ProductIndex.vue` | Columns: No., Product ID, Types, Brand, Model, Capacity, Quantity. Server-side pagination (Previous/Next), server-side search, plus a client-side filter over the currently loaded page. |
| API type switch | dropdown in `ProductIndex.vue` | `restApi` ↔ `graphql` (default **graphql**). Switching resets the search and refetches page 1. |
| Debounced search | `src/composables/useDebouncedRef.js` | Custom `customRef` with a 500 ms `setTimeout` debounce, so a fetch fires only after typing pauses. |

## What it talks to

The app expects a Laravel-style backend at `http://127.0.0.1:8000` (hardcoded as `baseURL` in
`src/views/HomeView.vue`):

| Call | Endpoint | Used for |
| --- | --- | --- |
| REST list | `GET /api/products?page={n}&search={q}` | table data when API type = REST |
| GraphQL list | `POST /api/graphql` — `products(filter, page)` query with `paginatorInfo` | table data when API type = GraphQL (default) |
| Import | `POST /api/products/import` (multipart, field `file`) | the `.xlsx` upload |

Both list responses are normalized to the same shape before rendering:
`{ data, current_page, last_page, total, per_page }`.

**Without the backend running, the page still loads** — you get the upload card and an empty
table, with `Error loading products:` messages in the browser console. That is expected during
frontend-only work.

## What it is NOT

- Not a full-stack repo — no server code, no database, no schema for the `.xlsx` file.
- Not deployed — no CI/CD, no hosting; it runs on `http://localhost:8102` via `just start`.
- Not multi-page — the router has a single active route (`/`); an About route is scaffolded but
  commented out in `src/router/index.js`.

## Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Vue 3.5, `<script setup>` | plain JavaScript — no TypeScript |
| Build | Vite 6 | plugins: vue, vue-devtools, Tailwind v4 |
| Styling | Tailwind CSS v4 | via `@tailwindcss/vite`; no tailwind.config file |
| Forms | VeeValidate 4 + `@vee-validate/rules` | global plugin in `src/includes/validation.js` |
| HTTP | axios | GraphQL is a plain axios POST, no client library |
| State | Pinia 3 | installed; only the scaffold `counter` store exists (unused) |
| Tests | Vitest 3 + jsdom | specs in `src/**/__tests__/` (mocked axios; `just test`) |
| Quality | ESLint 9 (flat) + Prettier 3 | no hooks, no CI — run manually |

## Related docs

| Doc | Why |
| --- | --- |
| [`architecture.md`](architecture.md) | Component tree and data flow in detail |
| [`../02-setup/getting-started.md`](../02-setup/getting-started.md) | Get it running locally |
| [`../07-faq/faq.md`](../07-faq/faq.md) | Quick answers about the backend, ports, tests |
