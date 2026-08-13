<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree } from "$release";
  import { mounted, once, rendered } from "../testing";
  import Panel from "./Panel.svelte";
  import { expanded, sampleFileList } from "./demo-data";

  class Pocket {
    readonly model: Tree.Model;

    constructor(flattenEmptyDirectories: boolean) {
      this.model = new Tree.Model({
        paths: sampleFileList,
        flattenEmptyDirectories,
        initialExpansion: "closed",
        initialExpandedPaths: flattenEmptyDirectories
          ? expanded.flattenedBuild
          : expanded.hierarchicalBuild,
        search: false,
      });
    }
  }
</script>

<Sweater config category="Flatten empty directories" />

<Sweater
  name="Default expanded"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket(false));
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("Without flattening, `build/assets/images/social/` is four rows and four indents.");
    expect(model.rows.paths()).toEqual(
      expect.arrayContaining([
        "build/",
        "build/assets/",
        "build/assets/images/",
        "build/assets/images/social/",
      ]),
    );
    expect(model.rows.all().some((row) => row.isFlattened)).toBe(false);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel {model} title="Default expanded" description="flattenEmptyDirectories: false" />
  {/snippet}
</Sweater>

<Sweater
  name="Flattened directories"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket(true));
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("With it on, the same chain collapses to one row carrying all four segments.");
    const flattened = model.rows.all().find((row) => row.path === "build/assets/images/social/");
    expect(flattened?.isFlattened).toBe(true);
    expect(flattened?.flattenedSegments?.map(({ name }) => name)).toEqual([
      "assets",
      "images",
      "social",
    ]);

    note("Fewer rows, less indentation, same tree.");
    expect(model.rows.count).toBeLessThan(new Pocket(false).model.rows.count);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel {model} title="Flattened directories" description="flattenEmptyDirectories: true" />
  {/snippet}
</Sweater>
