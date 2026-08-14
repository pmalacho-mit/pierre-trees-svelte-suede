<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import { Tree } from "$release";
  import {
    doubleClick,
    mounted,
    once,
    pressKey,
    rendered,
    typeInto,
  } from "./testing";

  const project = [
    "README.md",
    "src/index.ts",
    "src/components/Button.svelte",
  ];

  class Pocket {
    readonly model: Tree.Model;

    constructor() {
      this.model = new Tree.Model({
        paths: project,
        initialExpansion: "open",
        renaming: true,
      });
    }
  }

  /**
   * Rows live in the tree's shadow root, so a handler on the host meets them
   * through `composedPath()`. `data-item-path` is where the tree puts a row's
   * path — the same attribute its `unsafeCSS` selectors target.
   */
  const rowPathIn = (event: Event): string | undefined =>
    event
      .composedPath()
      .find(
        (node): node is HTMLElement =>
          node instanceof HTMLElement && node.dataset.itemPath !== undefined,
      )?.dataset.itemPath;

  const renameRowUnder = (model: Tree.Model, event: MouseEvent) => {
    const path = rowPathIn(event);
    if (path !== undefined) model.rename(path);
  };

  const renameFileUnder = (model: Tree.Model, event: MouseEvent) => {
    const path = rowPathIn(event);
    if (path !== undefined && Tree.isFile(model.item(path))) model.rename(path);
  };

  const fill = "height: 100%; display: block;";
</script>

<Sweater config category="Rename on double click" mode="serial" />

<Sweater
  name="double clicking a row starts its rename"
  body={async ({ set, delay, expect, note, capture }) => {
    const renamed: Tree.Events["renamed"][0][] = [];
    const { model } = set(new Pocket());
    model.subscribe({ renamed: (event) => renamed.push(event) });
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("The tree has no double-click behaviour of its own; this is entirely the `ondblclick` on the component.");
    note("`Tree.Component` spreads the props it does not recognise onto the host, so any DOM handler works.");
    const row = rendered.row(model, "src/index.ts");
    if (!row) throw new Error("expected a row for src/index.ts");
    doubleClick(row);

    await once(delay, () => rendered.renameInput(model) !== null);
    const editor = rendered.renameInput(model);
    expect(editor?.value).toBe("index.ts");
    capture("png");

    if (!editor) throw new Error("expected a rename input");
    typeInto(editor, "main.ts");
    pressKey(editor, "Enter");
    await delay({ frames: 4 });

    note("From there it is the same rename every other trigger starts.");
    expect(renamed).toEqual([
      {
        sourcePath: "src/index.ts",
        destinationPath: "src/main.ts",
        isFolder: false,
      },
    ]);
    expect(model.rows.paths()).toContain("src/main.ts");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component
      {model}
      style={fill}
      ondblclick={(event) => renameRowUnder(model, event)}
    />
  {/snippet}
</Sweater>

<Sweater
  name="`renaming` has to be on, or the double click is a no-op"
  body={async ({ set, delay, expect, note, capture }) => {
    const model = new Tree.Model({ paths: project, initialExpansion: "open" });
    set({ model });
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("`model.rename` answers `false` without the option, so the handler above quietly does nothing.");
    const row = rendered.row(model, "src/index.ts");
    if (!row) throw new Error("expected a row for src/index.ts");
    doubleClick(row);
    await delay({ frames: 8 });

    expect(rendered.renameInput(model)).toBe(null);
    expect(model.rows.paths()).toContain("src/index.ts");
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component
      {model}
      style={fill}
      ondblclick={(event) => renameRowUnder(model, event)}
    />
  {/snippet}
</Sweater>

<Sweater config category="Files only" mode="serial" />

<Sweater
  name="a guard leaves a directory double click alone"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket());
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("Renaming a folder on double click fights the expand it already means, so `Tree.isFile` guards it.");
    const directory = rendered.row(model, "src/components/");
    if (!directory) throw new Error("expected a row for src/components/");
    doubleClick(directory);
    await delay({ frames: 8 });
    expect(rendered.renameInput(model)).toBe(null);

    note("The two clicks underneath a double click still reach the tree, so the folder toggles as usual.");
    expect(model.rows.paths()).toContain("src/components/Button.svelte");

    const file = rendered.row(model, "README.md");
    if (!file) throw new Error("expected a row for README.md");
    doubleClick(file);
    await once(delay, () => rendered.renameInput(model) !== null);
    expect(rendered.renameInput(model)?.value).toBe("README.md");
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component
      {model}
      style={fill}
      ondblclick={(event) => renameFileUnder(model, event)}
    />
  {/snippet}
</Sweater>
