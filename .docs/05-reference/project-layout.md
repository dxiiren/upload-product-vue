# Project Layout

> **TL;DR** Standard Vite + Vue 3 SPA layout: config at the root, everything interesting under
> `src/` (views own pages + API calls, components are presentational), plus the onboarding-kit
> meta files (`justfile`, `setup.ps1`, `.docs/`, `.claude/`).

## Annotated tree

```
vue-inventory-ui/
├── index.html                 # Vite entry page (#app mount point, loads src/main.js)
├── vite.config.js             # plugins: vue, vue-devtools, Tailwind v4; '@' alias -> src/
├── vitest.config.js           # merges vite.config.js; jsdom env; excludes e2e/**
├── eslint.config.js           # ESLint 9 flat config: js + vue + vitest + prettier-compat
├── .prettierrc.json           # Prettier settings
├── .editorconfig              # editor defaults
├── jsconfig.json              # '@/*' path mapping for editors
├── package.json               # scripts + deps (npm; lockfile committed)
├── package-lock.json
│
├── justfile                   # task runner recipes (see 05-reference/commands.md)
├── setup.ps1                  # idempotent machine bootstrap (Git, Node, just, uv, ...)
├── README.md                  # quick start + cheat sheet
├── CLAUDE.md                  # Claude Code project instructions
├── .mcp.json.stub             # committed MCP config template (secrets as placeholders)
│
├── public/
│   └── favicon.ico            # served as-is at /favicon.ico
│
├── src/
│   ├── main.js                # createApp + Pinia + router + VeeValidate plugin + css imports
│   ├── App.vue                # root component: just <router-view />
│   ├── router/
│   │   └── index.js           # createWebHistory; single route '/' -> HomeView
│   ├── views/
│   │   ├── HomeView.vue       # THE page: layout shell + demo banner + all API calls (REST/GraphQL/upload)
│   │   └── __tests__/
│   │       └── HomeView.spec.js  # Vitest spec: mocked axios; render + endpoints + demo fallback
│   ├── components/
│   │   ├── UploadProduct.vue  # .xlsx upload form (VeeValidate); emits uploadProducts
│   │   ├── __tests__/
│   │   │   └── UploadProduct.spec.js  # required + excluded MIME rules, uploadProducts emit
│   │   └── product/
│   │       ├── ProductIndex.vue  # table + search + API-type select + pagination + skeleton/empty state
│   │       └── __tests__/
│   │           └── ProductIndex.spec.js  # pagination guard (no NaN), debounced search, empty state, skeleton
│   ├── data/
│   │   ├── demoProducts.js    # static demo catalogue + mock adapter (backend-down fallback)
│   │   └── __tests__/
│   │       └── demoProducts.spec.js  # search, page clamping, paginator shape contract
│   ├── composables/
│   │   ├── useDebouncedRef.js # customRef with 500 ms debounce (search box)
│   │   └── __tests__/
│   │       └── useDebouncedRef.spec.js  # trailing-edge debounce, timer reset, custom delay
│   ├── includes/
│   │   └── validation.js      # global VeeValidate plugin: components, rules, messages
│   ├── stores/
│   │   └── counter.js         # Pinia scaffold store — currently unused by any page
│   └── assets/
│       ├── main.css           # Tailwind v4 entry
│       ├── base.css           # scaffold base styles / CSS variables
│       └── logo.svg           # scaffold asset (unused by the current UI)
│
├── .docs/                     # this documentation set (start at tldr.md)
├── .claude/
│   ├── settings.json          # committed Claude Code settings (permissions, MCP enable list)
│   ├── hooks/statusline.py    # statusline script (run via uv)
│   └── skills/                # project skills (see .claude/skills/README.md)
│
├── .vscode/extensions.json    # recommends the Vue (Volar) extension
├── .gitattributes, .gitignore
└── (git-ignored, generated)   # node_modules/, dist/, .mcp.json,
                               # .claude/settings.local.json, .claude/workspace/
```

## Orientation rules of thumb

| If you're looking for... | Go to |
| --- | --- |
| Anything that talks to the network | `src/views/HomeView.vue` — it is ALL there |
| Why a form field rejects input | `src/includes/validation.js` (rules + messages) |
| Why the search feels delayed | `src/composables/useDebouncedRef.js` (500 ms, by design) |
| The port / dev-server invocation | `justfile` (`port := 8102`, `--strictPort`) |
| What a command actually runs | `justfile` first, then `package.json` scripts |

## Related docs

| Doc | Why |
| --- | --- |
| [`commands.md`](commands.md) | The recipes that operate on this tree |
| [`../01-overview/architecture.md`](../01-overview/architecture.md) | How these files interact at runtime |
