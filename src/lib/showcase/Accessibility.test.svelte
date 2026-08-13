<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree } from "$release";
  import { mounted, once, pressKey, rendered } from "../testing";
  import Panel from "./Panel.svelte";
  import { expanded, sampleFileList } from "./demo-data";

  const SELECTED = "package.json";

  class Pocket {
    readonly model: Tree.Model;

    constructor() {
      this.model = new Tree.Model({
        paths: sampleFileList,
        flattenEmptyDirectories: true,
        initialExpandedPaths: expanded.source,
        initialSelectedPaths: [SELECTED],
        search: true,
        searchFakeFocus: true,
      });
    }
  }

  const tree = (model: Tree.Model) =>
    model.tree.getFileTreeContainer()?.shadowRoot?.querySelector('[role="tree"]') ?? null;
</script>

<Sweater config category="Accessible from the start" />

<Sweater
  name="rows are treeitems carrying level, position and set size"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket());
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("The container is a `tree`; every row is a `treeitem`.");
    expect(tree(model)).not.toBe(null);
    expect(rendered.rows(model).every((row) => row.getAttribute("role") === "treeitem")).toBe(true);

    note("Each row states where it sits, which is what a screen reader announces.");
    const nested = rendered.row(model, "src/components/Button.tsx");
    expect(nested?.getAttribute("aria-level")).toBe("3");
    expect(nested?.getAttribute("aria-posinset")).toBe("1");
    expect(nested?.getAttribute("aria-setsize")).toBe("4");

    note("Directories report their open state; selection is mirrored to `aria-selected`.");
    expect(rendered.row(model, "src/")?.getAttribute("aria-expanded")).toBe("true");
    expect(rendered.row(model, SELECTED)?.getAttribute("aria-selected")).toBe("true");
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel
      {model}
      title="ARIA out of the box"
      description="role=tree, role=treeitem, aria-level, aria-posinset, aria-setsize"
    />
  {/snippet}
</Sweater>

<Sweater
  name="one row is tabbable and the arrows do the rest"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket());
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("Roving tabindex: the focused row is the only tab stop in the whole tree.");
    model.focus.at("src/");
    await delay({ frames: 4 });
    const tabbable = rendered.rows(model).filter((row) => row.tabIndex === 0);
    expect(tabbable.map((row) => row.dataset.itemPath)).toEqual(["src/"]);

    const focused = rendered.row(model, "src/");
    if (!focused) throw new Error("expected a row for src/");

    note("ArrowDown walks to the next visible row.");
    pressKey(focused, "ArrowDown");
    await once(delay, () => model.focus.path !== "src/");
    expect(model.focus.path).toBe("src/components/");

    note("ArrowLeft collapses an open directory instead of moving.");
    pressKey(rendered.row(model, "src/components/") ?? focused, "ArrowLeft");
    await delay({ frames: 4 });
    expect(model.rows.paths()).not.toContain("src/components/Button.tsx");
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel
      {model}
      title="Keyboard navigation"
      description="Arrows move and fold, Enter selects, letters jump"
    />
  {/snippet}
</Sweater>
