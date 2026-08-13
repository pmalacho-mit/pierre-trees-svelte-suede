<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import { Tree } from "$release";
  import { mounted, once, rendered, rightClick } from "./testing";

  const project = [
    "README.md",
    "src/index.ts",
    "src/components/Button.svelte",
  ];

  class Pocket {
    readonly model: Tree.Model;
    title = $state("Project files");
    chosen = $state<string>();

    constructor(options: Tree.Options = { paths: project }) {
      this.model = new Tree.Model({ initialExpansion: "open", ...options });
    }
  }

  const withContextMenu: Tree.Options = {
    paths: project,
    composition: { contextMenu: { enabled: true } },
  };

  const fill = "height: 100%; display: block;";
</script>

<Sweater config category="Composition" orientation="vertical" />

<Sweater
  name="the header snippet renders into the tree's header slot"
  body={async ({ set, delay, expect, note, capture }) => {
    const pocket = set(new Pocket());
    await mounted(delay, pocket.model);
    await delay({ frames: 2 });

    note("The snippet is ordinary Svelte in the light DOM, slotted into the shadow root.");
    const [slotted] = rendered.headerSlot(pocket.model);
    expect(slotted?.textContent).toContain("Project files");

    note("Which means it stays reactive after the tree has mounted.");
    pocket.title = "Renamed";
    await delay({ frames: 2 });
    expect(rendered.headerSlot(pocket.model)[0]?.textContent).toContain(
      "Renamed",
    );
    capture("png");
  }}
>
  {#snippet vest(pocket: Pocket)}
    <Tree.Component model={pocket.model} style={fill}>
      {#snippet header()}
        <strong>{pocket.title}</strong>
      {/snippet}
    </Tree.Component>
  {/snippet}
</Sweater>

<Sweater
  name="the contextMenu snippet receives the item that was right-clicked"
  body={async ({ set, delay, expect, note, capture }) => {
    const pocket = set(new Pocket(withContextMenu));
    const { model } = pocket;
    await mounted(delay, model);
    await delay({ frames: 2 });

    note("Nothing is slotted until a menu opens.");
    expect(rendered.contextMenuSlot(model)).toEqual([]);

    const row = rendered.row(model, "README.md");
    if (!row) throw new Error("expected a row for README.md");
    rightClick(row);
    await once(delay, () => rendered.contextMenuSlot(model).length > 0);

    note("The snippet's first argument is `{ kind, name, path }` for that row.");
    expect(rendered.contextMenuSlot(model)[0]?.textContent).toContain(
      "README.md",
    );

    note("Its second argument closes the menu and restores focus to the row.");
    pocket.chosen = undefined;
    capture("png");
  }}
>
  {#snippet vest(pocket: Pocket)}
    <Tree.Component model={pocket.model} style={fill}>
      {#snippet contextMenu(item, context)}
        <menu>
          <button onclick={() => { pocket.chosen = item.path; context.close(); }}>
            Open {item.path}
          </button>
        </menu>
      {/snippet}
    </Tree.Component>
  {/snippet}
</Sweater>

<Sweater
  name="choosing a menu item closes the menu"
  body={async ({ set, delay, expect, note }) => {
    const pocket = set(new Pocket(withContextMenu));
    const { model } = pocket;
    await mounted(delay, model);
    await delay({ frames: 2 });

    const row = rendered.row(model, "src/index.ts");
    if (!row) throw new Error("expected a row for src/index.ts");
    rightClick(row);
    await once(delay, () => rendered.contextMenuSlot(model).length > 0);

    const button = rendered
      .contextMenuSlot(model)[0]
      ?.querySelector("button");
    button?.click();
    await once(delay, () => rendered.contextMenuSlot(model).length === 0);

    note("`context.close()` unmounts the slot, so the snippet controls its own lifetime.");
    expect(pocket.chosen).toBe("src/index.ts");
  }}
>
  {#snippet vest(pocket: Pocket)}
    <Tree.Component model={pocket.model} style={fill}>
      {#snippet contextMenu(item, context)}
        <menu>
          <button onclick={() => { pocket.chosen = item.path; context.close(); }}>
            Open {item.path}
          </button>
        </menu>
      {/snippet}
    </Tree.Component>
  {/snippet}
</Sweater>

<Sweater
  name="triggerMode adds a dedicated action lane beside right-click"
  body={async ({ set, delay, expect, note }) => {
    const { model } = set(
      new Pocket({
        paths: project,
        composition: {
          contextMenu: {
            enabled: true,
            triggerMode: "button",
            buttonVisibility: "always",
          },
        },
      }),
    );
    await mounted(delay, model);
    await delay({ frames: 2 });

    note("Rows advertise the menu to assistive tech and reserve room for the trigger.");
    const row = rendered.row(model, "README.md");
    expect(row?.getAttribute("aria-haspopup")).toBe("menu");
    expect(row?.dataset.itemContextMenuTriggerMode).toBe("button");
    expect(row?.dataset.itemHasContextMenuActionLane).toBe("true");
    expect(row?.dataset.itemContextMenuButtonVisibility).toBe("always");
  }}
>
  {#snippet vest(pocket: Pocket)}
    <Tree.Component model={pocket.model} style={fill}>
      {#snippet contextMenu(item)}
        <menu><button>Open {item.name}</button></menu>
      {/snippet}
    </Tree.Component>
  {/snippet}
</Sweater>
