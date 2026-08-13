<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree } from "$release";
  import { mounted, once, rendered } from "../testing";
  import Panel from "./Panel.svelte";
  import { expanded, sampleFileList } from "./demo-data";

  const LOCKED = "package.json";

  class Pocket {
    readonly model: Tree.Model;
    readonly refused: string[] = [];

    constructor(lock: boolean) {
      this.model = new Tree.Model({
        paths: sampleFileList,
        flattenEmptyDirectories: true,
        initialExpandedPaths: expanded.source,
        search: false,
        dragAndDrop: {
          canDrag: (paths) => !lock || !paths.includes(LOCKED),
        },
        renderRowDecoration: ({ item }) =>
          lock && item.path === LOCKED
            ? { icon: "file-tree-icon-lock", title: "Locked file" }
            : null,
      });
      this.model.subscribe({
        dropped: ({ draggedPaths, target }) =>
          this.refused.push(`${draggedPaths.join(",")} → ${target.directoryPath}`),
      });
    }
  }
</script>

<Sweater config category="Drag and drop" />

<Sweater
  name="every row becomes draggable, and canDrag can lock one"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket(true));
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("`dragAndDrop: true` is enough; the object form adds the policy callbacks.");
    expect(rendered.row(model, "README.md")?.getAttribute("draggable")).toBe("true");

    note("`renderRowDecoration` marks the row `canDrag` refuses with the built-in lock icon.");
    const decorated = rendered.row(model, LOCKED);
    expect(decorated?.querySelector('[data-icon-name="file-tree-icon-lock"]')).not.toBe(null);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel {model} title="Locked" description="canDrag refuses package.json" />
  {/snippet}
</Sweater>

<Sweater
  name="a move through the model is the same move a drop performs"
  body={async ({ set, delay, expect, note, capture }) => {
    const pocket = set(new Pocket(false));
    const { model } = pocket;
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("Without `canDrag` nothing is locked and no decoration lane is drawn.");
    expect(rendered.row(model, LOCKED)?.querySelector("[data-icon-name='file-tree-icon-lock']"))
      .toBe(null);

    note("A drop ends in `move`, which is reachable directly — same result, no pointer needed.");
    model.move("src/lib/utils.ts", "src/utils/utils.ts");
    await once(delay, () => model.item("src/utils/utils.ts") !== null);
    expect(model.item("src/lib/utils.ts")).toBe(null);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel {model} title="Unlocked" description="Everything can move" />
  {/snippet}
</Sweater>
