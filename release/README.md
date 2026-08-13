# pierre-trees-svelte-suede

> [!NOTE]
> This is a [suede](https://github.com/pmalacho-mit/suede) dependency.

A Svelte 5 wrapper around [`@pierre/trees`](https://trees.software/) — the
path-first, virtualized file tree from the Pierre team.

`@pierre/trees` already owns the hard parts: a path-keyed store, virtualized
rendering into a shadow root, search, drag and drop, inline renaming, git status
and icons. What it does not have is a Svelte face. This library adds two things
and gets out of the way:

- **`Tree.Model`** — a TypeScript class that owns a `FileTree` and republishes
  the parts you would otherwise have to poll (`focus`, `selection`, `search`,
  `rows`) as Svelte state, plus a typed `subscribe` for everything that happens.
- **`Tree.Component`** — mounts a model into a `<file-tree-container>` and fills
  the tree's `header` and `context-menu` slots from Svelte snippets.

Anything not mirrored here is one property away: `model.tree` is the underlying
`FileTree` instance, unwrapped.

---

## Contents

1. [Getting started](#1-getting-started)
2. [`Tree.Model`](#2-treemodel)
3. [`Tree.Component`](#3-treecomponent)
4. [Events](#4-events)
5. [Input, icons, theming, density](#5-input-icons-theming-density)
6. [Types](#6-types)

---

## 1. Getting started

```svelte
<script lang="ts">
  import { Tree } from "<path>/pierre-trees-svelte-suede";

  const model = new Tree.Model({
    paths: ["README.md", "src/index.ts", "src/components/Button.svelte"],
    initialExpansion: "open",
  });
</script>

<Tree.Component {model} style="height: 320px;" />

<p>Selected: {model.selection.paths.join(", ")}</p>
```

The host element has no height of its own, so give it one — through `style`,
`class`, or a sized parent.

`Tree.Model` takes `@pierre/trees`' `FileTreeOptions` unchanged, so every option
in the upstream docs works here. Reach for `model.dispose()` when a model
outlives the component that rendered it.

---

## 2. `Tree.Model`

### Reactive state

Reading any of these inside an effect, a `$derived`, or markup re-runs when the
tree changes. They are refreshed from a single subscription to the tree, so
there is nothing to poll and nothing to invalidate.

| Read                    | Type                     |
| ----------------------- | ------------------------ |
| `model.selection.paths` | `readonly string[]`      |
| `model.focus.path`      | `string \| null`         |
| `model.focus.index`     | `number`                 |
| `model.search.isOpen`   | `boolean`                |
| `model.search.value`    | `string`                 |
| `model.search.matches`  | `readonly string[]`      |
| `model.rows.count`      | `number`                 |

### Structure

```ts
model.add("src/main.ts");
model.remove("src/legacy/", { recursive: true });
model.move("src/components/", "src/ui/", { collision: "skip" });
model.batch([
  { type: "add", path: "docs/guide.md" },
  { type: "move", from: "README.md", to: "docs/README.md" },
]);
model.reset(["a.txt", "b/c.txt"]);
model.reset({ preparedInput });
```

Removing a populated directory needs `{ recursive: true }`. A `move` carries
every descendant with it. A `batch` reaches subscribers as one event.

### Rows

`rows` is the visible projection — what expansion, flattening and search have
left on screen, not the raw path list.

```ts
model.rows.count; // reactive
model.rows.slice(0, 19); // both ends inclusive, both clamped
model.rows.all();
model.rows.paths();
model.rows.names();
```

### Focus

```ts
model.focus.at("src/index.ts");
model.focus.first();
model.focus.last();
model.focus.next();
model.focus.previous();
model.focus.parent();
model.focus.nearest("src/deleted.ts"); // → the closest surviving path
model.focus.item; // the item handle, or null
```

### Selection

```ts
model.selection.add("README.md");
model.selection.remove("README.md");
model.selection.toggle("README.md");
model.selection.only("README.md");
model.selection.clear();
model.selection.has("README.md");
```

### Search

Search is a session: `set(value)` opens one, `set(null)` ends it. What happens
to non-matching rows is `fileTreeSearchMode`, which defaults to
`hide-non-matches`.

```ts
model.search.set("button");
model.search.matches; // ["src/components/Button.svelte"]
model.search.focusNext(); // clamps at the last match, does not wrap
model.search.focusPrevious();
model.search.close();
```

Passing `search: true` to the constructor also renders the tree's own search
input; `searchBlurBehavior` then decides whether clicking away ends the session.

### Items

```ts
const item = model.item("src/components/"); // bare "src/components" works too
if (item?.isDirectory()) item.toggle();
```

`isDirectory()` narrows the handle, so `expand`, `collapse`, `toggle` and
`isExpanded` only typecheck where they exist.

### The rest

```ts
model.rename("src/index.ts"); // no argument renames the focused row
model.scrollTo("pkg/1500/file.ts", { focus: true, offset: "center" });
model.git.set([{ path: "README.md", status: "modified" }]);
model.git.patch({ set: [...], remove: ["src/index.ts"] });
model.setIcons({ set: "standard", byFileExtension: { svelte: "flame" } });
model.mount(element); // returns the unmount function
model.dispose();
```

`rename` only does anything when the model was built with `renaming`, and only
for a row that is currently on screen.

---

## 3. `Tree.Component`

```svelte
<Tree.Component {model} class="explorer" style="height: 100%;">
  {#snippet header()}
    <strong>{project.name}</strong>
  {/snippet}

  {#snippet contextMenu(item, context)}
    <menu>
      <button onclick={() => { open(item.path); context.close(); }}>
        Open {item.name}
      </button>
    </menu>
  {/snippet}
</Tree.Component>
```

| Prop          | Type                                              |
| ------------- | ------------------------------------------------- |
| `model`       | `Tree.Model` — required                           |
| `header`      | `Snippet` — fills the tree's header slot          |
| `contextMenu` | `Snippet<[item, context]>` — fills the menu slot  |
| …rest         | any `HTMLAttributes<HTMLElement>`, spread on the host |

Both snippets render in the light DOM and are slotted into the tree's shadow
root, which is why they stay ordinary, reactive Svelte. Supplying `header`
replaces `composition.header`; supplying `contextMenu` enables the context menu
and replaces `composition.contextMenu.render`, leaving the rest of that
configuration (`triggerMode`, `buttonVisibility`, `onOpen`, `onClose`) alone.

`context.close()` unmounts the menu, so the snippet controls its own lifetime.

---

## 4. Events

`model.subscribe(handlers)` takes a map and returns one unsubscribe for all of
it. Handlers are fully typed by event name.

```ts
const stop = model.subscribe({
  added: ({ path }) => log(`+ ${path}`),
  removed: ({ path, recursive }) => log(`- ${path}`),
  moved: ({ from, to }) => log(`${from} → ${to}`),
  reset: ({ pathCountBefore, pathCountAfter }) => log("reset"),
  batched: ({ events }) => log(`${events.length} at once`),
  mutated: ({ operation }) => log(operation),
  "selection changed": (paths) => log(paths),
  "focus changed": (path) => log(path),
  "search changed": (value) => log(value),
  renamed: ({ sourcePath, destinationPath }) => log("renamed"),
  "rename refused": (error) => log(error),
  dropped: ({ draggedPaths, target }) => log("dropped"),
  "drop refused": (error, context) => log(error),
});
```

`renamed` / `rename refused` need `renaming` enabled, and `dropped` /
`drop refused` need `dragAndDrop` enabled — the model relays the upstream
callbacks rather than replacing them, so a config that already supplies
`onRename` or `onDropComplete` keeps working.

---

## 5. Input, icons, theming, density

```ts
import { density, icons, input, theme } from "<path>/pierre-trees-svelte-suede";

const prepared = input.prepare(paths, { flattenEmptyDirectories: false });
const presorted = input.presorted(alreadySortedPaths);

icons.spriteSheet("standard"); // the built-in <symbol> markup
icons.resolver(config).resolveIcon("file-tree-icon-file", "src/App.svelte");

theme.styles(shikiTheme); // { "--trees-theme-…": "…" } for style: directives
theme.css(shikiTheme); // the same, as a style attribute string

density.presets.compact.itemHeight;
density.defaultItemHeight;
```

Preparing input sorts and flattens once, so the same result can seed many trees
or many resets. For styling, start with the host's CSS custom properties and
`theme`, and keep `unsafeCSS` for what those cannot reach.

---

## 6. Types

Everything hangs off the `Tree` namespace, so one import covers the surface:

```ts
import type { Tree } from "<path>/pierre-trees-svelte-suede";

let model: Tree.Model;
let options: Tree.Options;
let handlers: Tree.Handlers;
let row: Tree.Row;
let item: Tree.Item; // Tree.Directory | Tree.File
let mode: Tree.SearchMode;
```

`Tree.Events` is the event map itself, so `Tree.Events["renamed"][0]` names the
payload of a single event without importing from `@pierre/trees` directly.
