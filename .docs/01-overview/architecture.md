# Architecture

> **TL;DR** One route, one smart view, two presentational components. `HomeView.vue` owns all
> state and every API call; children communicate up via emitted events. REST and GraphQL
> responses are normalized to one paginator shape. Cross-cutting pieces: a global VeeValidate
> plugin, a debounced-ref composable, Tailwind v4 via Vite plugin.

## Component tree

```
main.js                      # createApp + Pinia + Router + VeeValidate plugin
└─ App.vue                   # bare <router-view />
   └─ HomeView.vue           # route "/" — the only page (SMART: state + API)
      ├─ UploadProduct.vue   # upload card (DUMB: emits uploadProducts)
      └─ ProductIndex.vue    # table card (DUMB: props in, events out)
```

## Data flow

`HomeView.vue` is the single owner of server state (`productsData`, `currentPage`). Children
never fetch; they emit.

| Event (child → HomeView) | Emitted by | HomeView reaction |
| --- | --- | --- |
| `uploadProducts(values)` | UploadProduct | `POST /api/products/import` (multipart), alert, `window.location.reload()` |
| `apiCallTypeChanged({apiCallType, search})` | ProductIndex | reset to page 1, refetch via the chosen API |
| `searchChanged({apiCallType, search})` | ProductIndex | reset to page 1, refetch with the search term |
| `prevPage` / `nextPage` | ProductIndex | guard bounds, adjust `currentPage`, refetch |

Props down: `ProductIndex` receives the whole `productsData` object (`data`, `current_page`,
`last_page`, `total`, `per_page`) and renders rows + the "Showing X to Y of Z" footer from it.

## The dual API client

`getProducts(search, apiCallType)` in `HomeView.vue` branches to one of two fetchers, both of
which return the **same normalized shape** so the rest of the app is API-agnostic:

| Fetcher | Transport | Normalization |
| --- | --- | --- |
| `fetchFromRestAPI` | `GET {baseURL}/api/products?page&search` | unwraps Laravel's `response.data.data.*` paginator |
| `fetchFromGraphQL` | `POST {baseURL}/api/graphql` with a `SearchProducts` query | maps `paginatorInfo.{currentPage,lastPage,total,perPage}` to snake_case |

`baseURL` is a hardcoded `const` (`http://127.0.0.1:8000`) at the top of `HomeView.vue` — the
first thing to make configurable (env var / `import.meta.env`) if this app ever leaves
localhost.

## Search: two layers

1. **Server-side** — `ProductIndex` watches its debounced `search` ref and emits
   `searchChanged`; HomeView refetches with `?search=` (REST) or `filter.search` (GraphQL).
2. **Client-side** — `filteredData` (computed in `ProductIndex`) additionally filters the
   currently loaded page by substring across all fields. This means typing narrows the visible
   rows instantly, then the debounced server fetch replaces the page.

The debounce is `useDebouncedRef` (`src/composables/useDebouncedRef.js`): a `customRef` whose
setter defers `trigger()` by 500 ms via `setTimeout`, clearing the previous timer on each
keystroke.

## Validation

`src/includes/validation.js` is an app-level plugin registered in `main.js`. It:

- registers `VeeForm`, `VeeField`, `ErrorMessage` as global components;
- defines the rule set (`required`, `min`/`max`, `email`, `excluded`, ...) from
  `@vee-validate/rules` (plus aliases like `tos`, `country_excluded`, `password_mismatch` —
  broader than this app currently uses, ready for growth);
- provides a `generateMessage` map of human-readable errors;
- validates on blur/change/model-update but not on every keystroke.

The upload field uses `rules="required|excluded:application/pdf,text/plain,image/jpeg"` plus
`accept=".xlsx"` — note the excluded-list approach blocks a few known-bad MIME types rather
than allowlisting xlsx; the backend remains the real gatekeeper.

## Styling

Tailwind CSS **v4** through `@tailwindcss/vite` — there is no `tailwind.config.js`; the CSS
entry (`src/assets/main.css`) pulls Tailwind in and `base.css` holds the scaffold base styles.
Cards are plain utility classes (`bg-white rounded-2xl shadow-md p-6`).

## Deliberate simplifications (current state)

| Choice | Consequence |
| --- | --- |
| Pinia installed but only the scaffold `counter` store exists | all real state lives in `HomeView`; move it to a store if a second page ever needs it |
| `alert()` + full page reload after upload | no toast system; reload refetches everything |
| Failed fetches fall back to demo data | `src/data/demoProducts.js` catalogue + dismissible banner; warning logged to console |
| Router has one route | About view scaffolded but commented out |

## Related docs

| Doc | Why |
| --- | --- |
| [`project-overview.md`](project-overview.md) | Feature-level view and the API endpoint table |
| [`../03-development/workflow.md`](../03-development/workflow.md) | How to change this code safely |
| [`../05-reference/project-layout.md`](../05-reference/project-layout.md) | File-by-file map |
