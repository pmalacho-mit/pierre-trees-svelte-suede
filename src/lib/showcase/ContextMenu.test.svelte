<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree } from "$release";
  import {
    contextMenuTrigger,
    hoverRow,
    mounted,
    once,
    rendered,
    rightClick,
  } from "../testing";
  import ContextMenu, { type Action } from "./ContextMenu.svelte";
  import Panel from "./Panel.svelte";
  import { entries } from "./entries";
  import { expanded, sampleFileList } from "./demo-data";

  class Pocket {
    readonly model: Tree.Model;

    constructor(triggerMode: Tree.TriggerMode) {
      this.model = new Tree.Model({
        paths: sampleFileList,
        flattenEmptyDirectories: true,
        initialExpandedPaths: expanded.source,
        renaming: true,
        search: false,
        composition: { contextMenu: { enabled: true, triggerMode } },
      });
    }

    actions(item: Tree.ContextMenu["item"], close: () => void): Action[] {
      const { model } = this;
      const keepingFocusFor = (act: () => void) => () => {
        close();
        act();
      };
      return [
        { label: "New file", run: keepingFocusFor(() => entries.add(model, item, "file")) },
        { label: "New folder", run: keepingFocusFor(() => entries.add(model, item, "folder")) },
        { label: "Rename", run: keepingFocusFor(() => entries.rename(model, item)) },
        {
          label: "Delete",
          danger: true,
          divided: true,
          run: keepingFocusFor(() => entries.remove(model, item)),
        },
      ];
    }
  }

  const PATH = "src/components/Button.tsx";

  /** In button mode one floating trigger follows the hovered row. */
  const openFromButton = async (
    model: Tree.Model,
    settle: (frames: { frames: number }) => Promise<void>,
  ) => {
    hoverRow(model, PATH);
    await once(
      settle,
      () => contextMenuTrigger(model)?.dataset.visible === "true",
    );
    contextMenuTrigger(model)?.click();
  };
</script>

<Sweater config category="Context menu composition" />

{#each [["both", "Both"], ["right-click", "Right click"], ["button", "Button"]] as const as [triggerMode, title]}
  <Sweater
    name={`triggerMode: ${triggerMode}`}
    body={async ({ set, delay, expect, note, capture }) => {
      const { model } = set(new Pocket(triggerMode));
      await mounted(delay, model);
      await once(delay, () => rendered.rows(model).length > 0);

      const row = rendered.row(model, PATH);
      if (!row) throw new Error("expected a row for Button.tsx");

      note(`\`triggerMode: '${triggerMode}'\` decides how a row asks for its menu.`);
      expect(row.dataset.itemContextMenuTriggerMode).toBe(triggerMode);
      expect(row.getAttribute("aria-haspopup")).toBe("menu");

      let clickedAt: { x: number; y: number } | null = null;
      if (triggerMode === "button") await openFromButton(model, delay);
      else clickedAt = rightClick(row);

      await once(delay, () => rendered.contextMenuSlot(model).length > 0);
      await delay({ frames: 6 });

      note("The menu itself is a plain Svelte snippet — New file, New folder, Rename, Delete.");
      const menu = rendered.contextMenuSlot(model)[0];
      expect([...(menu?.querySelectorAll("button") ?? [])].map((b) => b.textContent?.trim()))
        .toEqual(["New file", "New folder", "Rename", "Delete"]);

      note("The tree slots it into an anchor already positioned over the row, so it needs no coordinates of its own.");
      const placed = menu?.firstElementChild?.getBoundingClientRect();
      const near = clickedAt ?? {
        x: contextMenuTrigger(model)?.getBoundingClientRect().right ?? 0,
        y: row.getBoundingClientRect().bottom,
      };
      expect(Math.abs((placed?.left ?? 0) - near.x)).toBeLessThan(220);
      expect(Math.abs((placed?.top ?? 0) - near.y)).toBeLessThan(60);

      note("The capture below cannot show it — a screenshot flattens the light DOM, and the open menu lives in the tree's context-menu slot. Open this test in the browser to see it.");
      capture("png");
    }}
  >
    {#snippet vest(pocket: Pocket)}
      <Panel model={pocket.model} {title}>
        {#snippet contextMenu(item, context)}
          <ContextMenu
            {context}
            actions={pocket.actions(item, () => context.close({ restoreFocus: false }))}
          />
        {/snippet}
      </Panel>
    {/snippet}
  </Sweater>
{/each}

<Sweater config category="Context menu actions" />

<Sweater
  name="New file adds a placeholder and opens it for renaming"
  body={async ({ set, delay, expect, note, capture }) => {
    const pocket = set(new Pocket("both"));
    const { model } = pocket;
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    const row = rendered.row(model, "src/components/");
    if (!row) throw new Error("expected a row for src/components/");
    rightClick(row);
    await once(delay, () => rendered.contextMenuSlot(model).length > 0);

    rendered.contextMenuSlot(model)[0]?.querySelector("button")?.click();
    await once(delay, () => rendered.renameInput(model) !== null);

    note("A new entry lands inside the clicked directory, already in rename mode.");
    expect(model.rows.paths()).toContain("src/components/untitled");
    expect(rendered.renameInput(model)?.value).toBe("untitled");
    capture("png");
  }}
>
  {#snippet vest(pocket: Pocket)}
    <Panel model={pocket.model} title="New file">
      {#snippet contextMenu(item, context)}
        <ContextMenu
          {context}
          actions={pocket.actions(item, () => context.close({ restoreFocus: false }))}
        />
      {/snippet}
    </Panel>
  {/snippet}
</Sweater>

<Sweater
  name="Delete takes a directory and everything under it"
  body={async ({ set, delay, expect, note, capture }) => {
    const pocket = set(new Pocket("both"));
    const { model } = pocket;
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    const row = rendered.row(model, "src/components/");
    if (!row) throw new Error("expected a row for src/components/");
    rightClick(row);
    await once(delay, () => rendered.contextMenuSlot(model).length > 0);

    const buttons = rendered.contextMenuSlot(model)[0]?.querySelectorAll("button");
    buttons?.[3]?.click();
    await once(delay, () => !model.rows.paths().includes("src/components/"));

    note("`remove` is recursive for a directory and plain for a file.");
    expect(model.rows.paths()).not.toContain("src/components/Button.tsx");
    expect(model.rows.paths()).toContain("src/index.ts");
    capture("png");
  }}
>
  {#snippet vest(pocket: Pocket)}
    <Panel model={pocket.model} title="Delete">
      {#snippet contextMenu(item, context)}
        <ContextMenu
          {context}
          actions={pocket.actions(item, () => context.close({ restoreFocus: false }))}
        />
      {/snippet}
    </Panel>
  {/snippet}
</Sweater>
