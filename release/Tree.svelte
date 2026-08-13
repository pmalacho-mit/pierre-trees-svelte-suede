<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { ContextMenuItem, ContextMenuOpenContext } from "@pierre/trees";
  import type { Model } from "./model.svelte";

  export type Props = Omit<HTMLAttributes<HTMLElement>, "children"> & {
    model: Model;
    header?: Snippet;
    contextMenu?: Snippet<
      [item: ContextMenuItem, context: ContextMenuOpenContext]
    >;
  };
</script>

<script lang="ts">
  import { composedWithSlots, type ContextMenuTrigger } from "./composition";

  let { model, header, contextMenu, ...host }: Props = $props();

  let container = $state<HTMLElement>();
  let trigger = $state<ContextMenuTrigger>();

  const baseline = $derived(model.tree.getComposition());

  const composition = $derived(
    composedWithSlots(baseline, {
      header: header !== undefined,
      contextMenu: contextMenu && {
        opened: (opened) => (trigger = opened),
        closed: () => (trigger = undefined),
      },
    }),
  );

  $effect(() => {
    model.tree.setComposition(composition);
  });

  $effect(() => {
    if (!container) return;
    const unmount = model.mount(container);
    return () => {
      unmount();
      model.tree.setComposition(baseline);
    };
  });
</script>

<file-tree-container
  bind:this={container}
  {...host}
  style:--trees-item-height="{model.tree.getItemHeight()}px"
  style:--trees-density-override={model.tree.getDensityFactor()}
>
  {#if header}
    <div slot="header">{@render header()}</div>
  {/if}
  {#if contextMenu && trigger}
    <div slot="context-menu">
      {@render contextMenu(trigger.item, trigger.context)}
    </div>
  {/if}
</file-tree-container>
