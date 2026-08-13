<script lang="ts" module>
  import type { Tree } from "$release";

  export type Action = {
    label: string;
    run: () => void;
    danger?: boolean;
    /** Draws a divider above this action. */
    divided?: boolean;
  };

  export type Props = {
    context: Tree.ContextMenu["context"];
    actions: readonly Action[];
  };

  /** A pointer-anchored menu carries no box; a trigger-anchored one carries the button's. */
  const fromPointer = (anchor: Tree.ContextMenu["context"]["anchorRect"]) =>
    anchor.width === 0 && anchor.height === 0;

  const step = (
    keys: readonly HTMLButtonElement[],
    from: Element | null,
    by: number,
  ) =>
    keys[
      (keys.indexOf(from as HTMLButtonElement) + by + keys.length) % keys.length
    ];
</script>

<script lang="ts">
  let { context, actions }: Props = $props();

  let menu = $state<HTMLElement>();
  let height = $state(0);

  // The tree slots this into an anchor element it has already positioned over
  // the row, so the menu only has to say which corner of that anchor to hang
  // from — no coordinates of its own.
  const anchor = $derived(context.anchorRect);
  const flipped = $derived(anchor.bottom + height > window.innerHeight);

  const items = (): HTMLButtonElement[] => [
    ...(menu?.querySelectorAll<HTMLButtonElement>("button") ?? []),
  ];

  $effect(() => {
    items()[0]?.focus({ preventScroll: true });
  });

  const navigate = (event: KeyboardEvent) => {
    const move = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (move === undefined) return;
    event.preventDefault();
    step(items(), document.activeElement, move)?.focus({ preventScroll: true });
  };
</script>

<div
  bind:this={menu}
  bind:clientHeight={height}
  role="menu"
  tabindex="-1"
  data-file-tree-context-menu-root="true"
  class:flipped
  class:trailing={!fromPointer(anchor)}
  onkeydown={navigate}
>
  {#each actions as action (action.label)}
    {#if action.divided}<hr />{/if}
    <button
      type="button"
      role="menuitem"
      class:danger={action.danger}
      onclick={action.run}
    >
      {action.label}
    </button>
  {/each}
</div>

<style>
  div {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 180px;
    padding: 0.25rem;
    color: oklch(98.5% 0 0);
    background: oklch(20.5% 0 0);
    background-clip: padding-box;
    border: 1px solid rgb(255 255 255 / 0.15);
    border-radius: 0.5rem;
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 0.25),
      0 4px 6px -4px rgb(0 0 0 / 0.25);
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    animation: open 120ms ease-out;
  }

  /* Anchored to the trigger button on the row's right edge: grow leftwards. */
  div.trailing {
    left: auto;
    right: 0;
  }

  div.flipped {
    top: auto;
    bottom: 100%;
  }

  @keyframes open {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
  }

  button {
    display: flex;
    align-items: center;
    padding: 0.375rem 0.75rem;
    font: inherit;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: inherit;
    text-align: left;
    background: none;
    border: 0;
    border-radius: 0.375rem;
    cursor: default;
    outline: none;
    user-select: none;
  }

  button:hover,
  button:focus-visible,
  button:focus {
    background: oklch(26.9% 0 0);
  }

  button.danger {
    color: oklch(70.4% 0.191 22.216);
  }

  button.danger:hover,
  button.danger:focus-visible,
  button.danger:focus {
    background: oklch(70.4% 0.191 22.216 / 0.15);
  }

  hr {
    height: 1px;
    margin: 0.25rem -0.25rem;
    background: oklch(26.9% 0 0);
    border: 0;
  }
</style>
