# Pierre Trees Svelte Suede

A [Svelte 5](https://svelte.dev/) wrapper around
[`@pierre/trees`](https://trees.software/): a `Tree.Model` class that republishes
the tree's focus, selection, search and rows as Svelte state, and a
`Tree.Component` that mounts it and fills the tree's header and context-menu
slots from snippets.

The library itself lives in [`release/`](./release) — start with its
[README](./release/README.md) for the full API.

This repo is a [suede dependency](https://github.com/pmalacho-mit/suede).

To see the installable source code, please checkout the [release branch](https://github.com/pmalacho-mit/pierre-trees-svelte-suede/tree/release).

## Installation

```bash
bash <(curl -fsSL https://suede.sh/install/release) --repo pmalacho-mit/pierre-trees-svelte-suede
```

<details>
<summary>
See alternative to using <a href="https://github.com/pmalacho-mit/suede#suedesh">suede.sh</a> script proxy
</summary>

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/pmalacho-mit/suede/refs/heads/main/scripts/install/release.sh) --repo pmalacho-mit/pierre-trees-svelte-suede
```

</details>

## Working on it

The repository root is a SvelteKit app that exists to exercise `release/`, which
it reaches through the `$release` alias.

```bash
npm install
npm run dev
```

- `/` — a demo explorer built from the library.
- `/tests` — every [sweater-vest](https://github.com/pmalacho-mit/sweater-vest-suede)
  test, live in the browser. Each one documents a behaviour of `@pierre/trees`
  as much as it verifies it.

```bash
npm run check    # svelte-check
npm run report   # drive every test through a containerized browser
```

`npm run report` needs `npm run dev` running in another terminal and a Docker
daemon; it writes `fashion-show.md` and exits non-zero on a failure.

Tests live in `src/lib/*.test.svelte` and are grouped by concern — rendering,
mutations, selection and focus, search, composition, presentation, renaming and
drag, virtualization. `src/lib/testing.ts` holds the shadow-root readers they
share, since the tree renders inside a shadow root that ordinary queries and
`userEvent` cannot reach.

### The showcase

`src/lib/showcase/` rebuilds every example from
[trees.software](https://trees.software/) on top of this library — flattening,
git status, context menu composition, drag and drop, the three search modes,
virtualization, accessibility, icon sets, Shiki themes, CSS-variable styling and
density. They use the same file list, palettes and expanded paths the Pierre
docs do, so a panel here should look like the panel there.

The menu those examples use is not part of the showcase — it graduated into
[`release/ContextMenu.svelte`](./release/ContextMenu.svelte), since it is the
menu most explorers want and nothing else in the library depends on it. A
screenshot cannot show it (captures flatten the light DOM and the open menu
lives in the tree's `context-menu` slot), so open
`/tests?component=/src/lib/showcase/ContextMenu.test.svelte` to see it.

> [!NOTE]
> `import.meta.glob` in the tests route is resolved once per dev server, so
> restart `npm run dev` after adding a new `.test.svelte` file.
