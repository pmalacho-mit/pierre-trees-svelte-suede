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

> [!NOTE]
> `import.meta.glob` in the tests route is resolved once per dev server, so
> restart `npm run dev` after adding a new `.test.svelte` file.
