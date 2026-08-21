<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree } from "$release";
  import { dragTo, mounted, once, rendered } from "../testing";
  import Panel from "./Panel.svelte";
  import { expanded, sampleFileList } from "./demo-data";

  const LOCKED = "package.json";

  class Pocket {
    readonly model: Tree.Model;
    /** Every completed drop, as `what → where`. */
    readonly drops: string[] = [];

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
          this.drops.push(
            `${draggedPaths.join(",")} → ${target.directoryPath ?? target.kind}`,
          ),
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

<Sweater
  name="the empty space below the rows is the root, so a file can be dragged out of its folder"
  body={async ({ set, delay, expect, note, capture }) => {
    const pocket = set(new Pocket(false));
    const { model } = pocket;
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    const row = rendered.row(model, "src/components/Button.tsx");
    const surface = rendered.surface(model);
    if (!row || !surface) throw new Error("the tree drew neither the row nor its surface");

    note(
      "The tree reads a drop target off the ROW under the pointer, and the surface " +
        "below the last row has none — which is what makes a drop there the root.",
    );
    dragTo(row, surface);
    await once(delay, () => model.item("Button.tsx") !== null);

    expect(model.item("src/components/Button.tsx")).toBe(null);
    note("It lands as a `move`, so it is announced as the drop it was.");
    expect(pocket.drops).toEqual(["src/components/Button.tsx → root"]);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel {model} title="Out to the root" description="Dropped past the last row" />
  {/snippet}
</Sweater>

<Sweater
  name="a drop on the root is still a drop, so canDrop and collisions both apply"
  body={async ({ set, delay, expect, note }) => {
    const pocket = set(new Pocket(false));
    const { model } = pocket;
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    const surface = rendered.surface(model);
    const row = rendered.row(model, "src/index.ts");
    if (!row || !surface) throw new Error("the tree drew neither the row nor its surface");

    note("`src/index.ts` would land on `index.ts`, and the root has no such entry yet.");
    model.add("index.ts");
    await once(delay, () => model.item("index.ts") !== null);

    const refusals: string[] = [];
    model.subscribe({ "drop refused": (error) => refusals.push(error) });

    dragTo(row, surface);
    await delay({ frames: 2 });

    note("A name the root is already using is refused, and nothing moves.");
    expect(model.item("src/index.ts")).not.toBe(null);
    expect(refusals).toEqual(['Destination already exists: "index.ts"']);
    expect(pocket.drops).toEqual([]);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel {model} title="Refused" description="index.ts is taken" />
  {/snippet}
</Sweater>
