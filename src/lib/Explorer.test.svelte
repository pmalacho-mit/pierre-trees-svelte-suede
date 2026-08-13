<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import Explorer from "./Explorer.svelte";
  import { once, typeInto } from "./testing";

  class Pocket {
    container = $state<HTMLDivElement>();
  }

  const treeIn = (container: HTMLElement) =>
    container.querySelector("file-tree-container");

  const rowsIn = (container: HTMLElement) => [
    ...(treeIn(container)?.shadowRoot?.querySelectorAll<HTMLElement>(
      '[data-type="item"]:not([data-file-tree-sticky-row])',
    ) ?? []),
  ];

  const pathsIn = (container: HTMLElement) =>
    rowsIn(container).map((row) => row.dataset.itemPath ?? "");
</script>

<Sweater config category="Explorer demo" orientation="vertical" />

<Sweater
  name="the demo explorer mounts a working tree"
  body={async ({ set, delay, definition, expect, note, capture }) => {
    set(new Pocket());
    const { container } = await definition("container");
    await once(delay, () => rowsIn(container).length > 0);

    note("Everything the demo does goes through the library — no direct FileTree use.");
    expect(pathsIn(container)).toContain("release/");
    expect(container.textContent).toContain("rows");
    capture("png");
  }}
>
  {#snippet vest(pocket: Pocket)}
    <div bind:this={pocket.container}><Explorer /></div>
  {/snippet}
</Sweater>

<Sweater
  name="typing in the demo's filter drives the model's search"
  body={async ({ set, delay, definition, expect, note, capture }) => {
    set(new Pocket());
    const { container } = await definition("container");
    await once(delay, () => rowsIn(container).length > 0);

    const filter = container.querySelector("input");
    if (!filter) throw new Error("expected the filter input");

    typeInto(filter, "Tree.svelte");
    await once(delay, () => pathsIn(container).length < 10);

    note("An `$effect` forwards the box's value to `model.search.set`.");
    expect(pathsIn(container)).toEqual(["release/", "release/Tree.svelte"]);

    typeInto(filter, "");
    await once(delay, () => pathsIn(container).length > 2);
    capture("png");
  }}
>
  {#snippet vest(pocket: Pocket)}
    <div bind:this={pocket.container}><Explorer /></div>
  {/snippet}
</Sweater>
