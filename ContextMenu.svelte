<script lang="ts" module>
  import type {
    ContextMenuAnchorRect,
    ContextMenuItem,
    ContextMenuOpenContext,
  } from "@pierre/trees";
  import type { Model } from "./model.svelte";
  import { entries } from "./entries";

  /** Something the menu offers to do. */
  type Doing = {
    label: string;
    run: () => void;
    danger?: boolean;
    /** Draws a divider above this action. */
    divided?: boolean;
  };

  /**
   * Something the menu SAYS rather than does.
   *
   * A menu that is shorter than usual has a reason, and the menu is the one
   * place a reader is already looking when they go to find the item that is
   * missing. Drawn muted, wrapping, and skipped by the keyboard, because a
   * line that cannot be run is not a stop on the way to one that can.
   */
  type Saying = {
    label: string;
    note: true;
    /** Draws a divider above this note. */
    divided?: boolean;
  };

  export type Action = Doing | Saying;

  /** Narrowed here rather than at each use, which is what keeps `run` required. */
  export const isNote = (action: Action): action is Saying => "note" in action;

  /** The surface's own holes, same shape as the tree's. */
  export type Variables = Partial<{
    "--trees-menu-bg": string;
    "--trees-menu-fg": string;
    "--trees-menu-border-color": string;
    "--trees-menu-hover-bg": string;
    "--trees-menu-danger-fg": string;
    "--trees-menu-border-radius": string;
    "--trees-menu-shadow": string;
    "--trees-menu-min-width": string;
    "--trees-menu-font-family": string;
    "--trees-menu-font-size": string;
  }>;

  export type Props = Variables & {
    context: ContextMenuOpenContext;
    actions: readonly Action[];
  };

  /**
   * New file, New folder, Rename, Delete — the four a file explorer is expected
   * to have, already wired to the tree. Build your own `Action[]` to say
   * anything else; `entries` holds the mutations these are made of.
   */
  export const standardActions = ({
    model,
    item,
    context,
  }: {
    model: Model;
    item: ContextMenuItem;
    context: ContextMenuOpenContext;
  }): Action[] => {
    // Renaming moves focus into the tree's own input, which the menu's usual
    // focus restore would immediately steal back.
    const handOver = (act: () => void) => () => {
      context.close({ restoreFocus: false });
      act();
    };
    return [
      { label: "New file", run: handOver(() => entries.add(model, item, "file")) },
      {
        label: "New folder",
        run: handOver(() => entries.add(model, item, "folder")),
      },
      { label: "Rename", run: handOver(() => entries.rename(model, item)) },
      {
        label: "Delete",
        danger: true,
        divided: true,
        run: handOver(() => entries.remove(model, item)),
      },
    ];
  };

  /** A pointer-anchored menu carries no box; a trigger-anchored one carries the button's. */
  const fromPointer = (anchor: ContextMenuAnchorRect) =>
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
  import { asStyle } from "./variables";

  let { context, actions, ...rest }: Props = $props();

  // Spread they arrive as props; written as `--x="y"` Svelte turns them into a
  // declaration this inherits instead. Either way they reach the surface.
  const style = $derived(asStyle(Object.entries(rest)));

  let menu = $state<HTMLElement>();
  let height = $state(0);
  /**
   * Whether anybody has actually driven this with the arrow keys.
   *
   * The menu focuses its first item as it opens so the keyboard has somewhere
   * to start, and painting THAT is what put a menu on screen with its first
   * action already lit and a second one lighting beside it on the first
   * hover. Neither `:focus` nor `:focus-visible` can be asked instead:
   * `:focus` is true the moment focus lands, and `:focus-visible` is a
   * browser heuristic about input modality that matches programmatic focus in
   * Chromium often enough to be no help here.
   *
   * So the question is asked directly. Nothing is painted for focus until an
   * arrow key has moved it, which is the only moment where a person needs
   * telling where they are and cannot see it for themselves.
   */
  let steered = $state(false);

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
    steered = true;
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
  class:steered
  class:trailing={!fromPointer(anchor)}
  onkeydown={navigate}
  {style}
>
  {#each actions as action (action.label)}
    {#if action.divided}<hr />{/if}
    {#if isNote(action)}
      <p>{action.label}</p>
    {:else}
      <button
        type="button"
        role="menuitem"
        class:danger={action.danger}
        onclick={action.run}
      >
        {action.label}
      </button>
    {/if}
  {/each}
</div>

<style>
  /*
   * EVERY COLOUR IS RESOLVED HERE, NOT INHERITED.
   *
   * The tree resolves its palette on `:host` -- `--trees-search-bg` and the
   * rest -- and a menu that is a light-DOM child of that host inherits the
   * answers for free. This USED to assume that was the only way a menu is
   * ever drawn, and it is not: a consumer that has to lift the menu out of
   * the tree (a panel that clips its overflow, a dock whose divider paints
   * over it, anything that needs the top layer) renders it as a SIBLING of
   * the host, where none of those inherit. Every chain then fell straight
   * through to the neutral fallbacks below while the tree beside it wore the
   * theme -- and a background is the one that shows, because a raised surface
   * that is not raised is not a surface.
   *
   * So each chain is restated below in full, in the order the host resolves
   * it: the menu's own hole, then the tree's resolved variable (which is what
   * inheritance supplies, and short-circuits the rest, so a menu inside the
   * host resolves exactly as it always did), then the `-override` a palette
   * sets, then the `--trees-theme-*` a theme fills in -- which is the half a
   * consumer CAN set from outside the shadow root, because `themeToTreeStyles`
   * hands it to them -- and only then the neutral.
   *
   * Declared as locals rather than written inline because `button` and `hr`
   * need three of them too, and a chain this long said twice is a chain that
   * drifts.
   *
   * A menu is a raised surface, which is why it borrows the tree's input
   * colours rather than its page background -- the one variable a palette is
   * free to make transparent.
   */
  div {
    --menu-fg: var(
      --trees-menu-fg,
      var(
        --trees-search-fg,
        var(
          --trees-search-fg-override,
          var(
            --trees-theme-input-fg,
            var(
              --trees-fg,
              var(
                --trees-fg-override,
                var(
                  --trees-theme-sidebar-fg,
                  light-dark(oklch(14.5% 0 0), oklch(98.5% 0 0))
                )
              )
            )
          )
        )
      )
    );
    --menu-bg: var(
      --trees-menu-bg,
      var(
        --trees-search-bg,
        var(
          --trees-search-bg-override,
          var(
            --trees-theme-input-bg,
            var(
              --trees-input-bg,
              var(
                --trees-input-bg-override,
                light-dark(oklch(100% 0 0), oklch(20.5% 0 0))
              )
            )
          )
        )
      )
    );
    --menu-border-color: var(
      --trees-menu-border-color,
      var(
        --trees-border-color,
        var(
          --trees-border-color-override,
          var(
            --trees-theme-sidebar-border,
            light-dark(rgb(0 0 0 / 0.1), rgb(255 255 255 / 0.15))
          )
        )
      )
    );
    --menu-hover-bg: var(
      --trees-menu-hover-bg,
      var(
        --trees-bg-muted,
        var(
          --trees-bg-muted-override,
          var(
            --trees-theme-list-hover-bg,
            light-dark(oklch(97% 0 0), oklch(26.9% 0 0))
          )
        )
      )
    );
    /*
     * MIXED FROM THE MENU'S OWN TEXT, not chained through the theme.
     *
     * The obvious chain -- `--trees-fg-muted`, then the theme's
     * `sideBarSectionHeader.foreground` -- was the first thing here and it
     * does not work: a theme is free to give its section headers the same
     * colour as its body text, and several do (GitHub Light spells both
     * `#2f363d`), so a note meant to sit back sat at exactly the weight of
     * the item under it. Relative to whatever the menu is actually wearing,
     * it always reads as the quieter of the two.
     */
    --menu-fg-muted: var(
      --trees-menu-fg-muted,
      color-mix(in oklch, var(--menu-fg) 62%, transparent)
    );
    --menu-danger-fg: var(
      --trees-menu-danger-fg,
      var(
        --trees-status-deleted,
        var(
          --trees-status-deleted-override,
          var(
            --trees-theme-git-deleted-fg,
            light-dark(oklch(57.7% 0.245 27.325), oklch(70.4% 0.191 22.216))
          )
        )
      )
    );

    position: absolute;
    top: 100%;
    left: 0;
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: var(--trees-menu-min-width, 180px);
    padding: 0.25rem;
    color: var(--menu-fg);
    background: var(--menu-bg);
    background-clip: padding-box;
    border: 1px solid var(--menu-border-color);
    border-radius: var(
      --trees-menu-border-radius,
      var(--trees-border-radius, var(--trees-border-radius-override, 0.5rem))
    );
    box-shadow: var(
      --trees-menu-shadow,
      0 10px 15px -3px light-dark(rgb(0 0 0 / 0.1), rgb(0 0 0 / 0.25)),
      0 4px 6px -4px light-dark(rgb(0 0 0 / 0.1), rgb(0 0 0 / 0.25))
    );
    font-family: var(
      --trees-menu-font-family,
      var(
        --trees-font-family,
        var(
          --trees-font-family-override,
          system-ui,
          -apple-system,
          "Segoe UI",
          sans-serif
        )
      )
    );
    font-size: var(
      --trees-menu-font-size,
      var(--trees-font-size, var(--trees-font-size-override, 0.875rem))
    );
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
    line-height: 1.4;
    color: inherit;
    text-align: left;
    background: none;
    border: 0;
    border-radius: var(
      --trees-menu-border-radius,
      var(--trees-border-radius, var(--trees-border-radius-override, 0.375rem))
    );
    cursor: default;
    outline: none;
    user-select: none;
  }

  /*
   * WHERE THE POINTER IS, or where the arrow keys have got to -- and the
   * second of those only once they have been used. See `steered`.
   */
  button:hover,
  div.steered button:focus {
    background: var(--menu-hover-bg);
  }

  button.danger {
    color: var(--menu-danger-fg);
  }

  button.danger:hover,
  div.steered button.danger:focus {
    background: color-mix(in oklch, currentColor 15%, transparent);
  }

  /*
   * Wrapping, and sized against the menu rather than the page, so a sentence
   * long enough to be worth saying does not force the menu wider than the
   * items under it. `max-width` and not `width`: a short note should still
   * let the menu be as narrow as its longest item.
   */
  p {
    margin: 0;
    padding: 0.375rem 0.75rem;
    max-width: 22ch;
    color: var(--menu-fg-muted);
    font-size: 0.9em;
    line-height: 1.35;
    text-wrap: pretty;
    user-select: none;
  }

  hr {
    height: 1px;
    margin: 0.25rem -0.25rem;
    background: var(--menu-border-color);
    border: 0;
  }
</style>
