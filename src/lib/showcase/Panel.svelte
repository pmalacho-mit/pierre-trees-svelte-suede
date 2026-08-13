<script lang="ts" module>
  import type { Snippet } from "svelte";
  import { Tree } from "$release";

  export type Props = {
    model: Tree.Model;
    title?: string;
    description?: string;
    /** Extra declarations for the host, e.g. one of the `palettes`. */
    style?: string;
    header?: Tree.Props["header"];
    contextMenu?: Tree.Props["contextMenu"];
    children?: Snippet;
  };

  const dark = "color-scheme: dark; --trees-search-bg-override: oklch(14.5% 0 0)";
</script>

<script lang="ts">
  let {
    model,
    title,
    description,
    style = dark,
    header,
    contextMenu,
    children,
  }: Props = $props();
</script>

<figure>
  {#if title}
    <figcaption>
      <h3>{title}</h3>
      {#if description}<p>{description}</p>{/if}
    </figcaption>
  {/if}

  <Tree.Component {model} {header} {contextMenu} {style} />

  {#if children}<div class="controls">{@render children()}</div>{/if}
</figure>

<style>
  figure {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
    margin: 0;
    gap: 0.5rem;
  }

  figcaption h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 500;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono",
      monospace;
  }

  figcaption p {
    margin: 0.125rem 0 0;
    font-size: 0.8rem;
    opacity: 0.7;
  }

  figure :global(file-tree-container) {
    /* The positioning context slotted overlays — the context menu — lay out against. */
    position: relative;
    flex: 1;
    min-height: 0;
    padding-block: 0.75rem;
    background: var(--panel-bg, transparent);
    border: 1px solid var(--panel-border, oklch(100% 0 0 / 0.12));
    border-radius: 0.5rem;
    box-shadow: var(--panel-shadow, none);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    opacity: 0.7;
  }
</style>
