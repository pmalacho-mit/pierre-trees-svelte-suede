<script lang="ts" module>
  const repository = [
    "README.md",
    "package.json",
    "release/index.ts",
    "release/Tree.svelte",
    "release/model.svelte.ts",
    "release/events.ts",
    "release/options.ts",
    "release/composition.ts",
    "release/snapshot.svelte.ts",
    "src/routes/+page.svelte",
    "src/lib/Explorer.svelte",
    "src/lib/testing.ts",
    "docs/adr/0001-path-first.md",
  ];

  const status: Tree.GitEntry[] = [
    { path: "release/model.svelte.ts", status: "modified" },
    { path: "release/Tree.svelte", status: "added" },
    { path: "docs/adr/0001-path-first.md", status: "untracked" },
  ];

  let untitled = 0;
  const nextUntitled = () => `src/lib/untitled-${++untitled}.ts`;
</script>

<script lang="ts">
  import { ContextMenu, Tree } from "$release";

  const model = new Tree.Model({
    paths: repository,
    initialExpansion: "open",
    gitStatus: status,
    icons: { set: "standard", colored: true },
    renaming: true,
    dragAndDrop: true,
    composition: { contextMenu: { enabled: true } },
  });

  let query = $state("");
  $effect(() => model.search.set(query === "" ? null : query));
</script>

<section>
  <label>
    Filter
    <input bind:value={query} placeholder="svelte" />
  </label>

  <Tree.Component {model}>
    {#snippet header()}
      <strong>pierre-trees-svelte-suede</strong>
    {/snippet}

    {#snippet contextMenu(item, context)}
      <ContextMenu.Component
        {context}
        actions={ContextMenu.actions({ model, item, context })}
      />
    {/snippet}
  </Tree.Component>

  <footer>
    <button onclick={() => model.add(nextUntitled())}>Add a file</button>
    <span>{model.rows.count} rows</span>
    <span>focus: {model.focus.path ?? "none"}</span>
    <span>selected: {model.selection.paths.join(", ") || "nothing"}</span>
  </footer>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 32rem;
  }

  section :global(file-tree-container) {
    height: 22rem;
    border: 1px solid color-mix(in oklch, currentColor 20%, transparent);
    border-radius: 0.5rem;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
  }

</style>
