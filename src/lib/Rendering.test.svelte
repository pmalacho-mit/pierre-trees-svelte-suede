<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import { Tree, density } from "$release";
  import { mounted, rendered } from "./testing";

  const project = [
    "README.md",
    "src/index.ts",
    "src/components/Button.svelte",
    "src/components/Modal.svelte",
    "src/lib/deep/nested/only-child.ts",
  ];

  class Pocket {
    readonly model: Tree.Model;

    constructor(options: Tree.Options) {
      this.model = new Tree.Model(options);
    }
  }

  const fill = "height: 100%; display: block;";
</script>

<Sweater config category="Rendering" orientation="vertical" />

<Sweater
  name="a flat path list becomes a tree of rows"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(
      new Pocket({ paths: project, initialExpansion: "open" }),
    );
    await mounted(delay, model);

    note("Only leaves are listed — every directory is implied by its children.");
    note("Directories sort ahead of files and keep a trailing slash in their path.");
    expect(rendered.paths(model)).toEqual([
      "src/",
      "src/components/",
      "src/components/Button.svelte",
      "src/components/Modal.svelte",
      "src/lib/deep/nested/",
      "src/lib/deep/nested/only-child.ts",
      "src/index.ts",
      "README.md",
    ]);

    note("`rows` mirrors what the model can see, not what the viewport happens to show.");
    expect(model.rows.count).toBe(8);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="initialExpansion decides how much of the tree starts open"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(
      new Pocket({ paths: project, initialExpansion: "closed" }),
    );
    await mounted(delay, model);

    note("`'closed'` (and `0`) leave only the top level on screen.");
    expect(rendered.paths(model)).toEqual(["src/", "README.md"]);

    note("A number opens that many levels; `'open'` opens all of them.");
    const byDepth = [1, 2, "open" as const].map((initialExpansion) => {
      const probe = new Tree.Model({ paths: project, initialExpansion });
      const count = probe.rows.count;
      probe.dispose();
      return count;
    });
    expect(byDepth).toEqual([5, 7, 8]);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="single-child directory chains are flattened into one row by default"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(
      new Pocket({ paths: project, initialExpansion: "open" }),
    );
    await mounted(delay, model);

    note("`src/lib/`, `src/lib/deep/` and `src/lib/deep/nested/` each hold exactly one child.");
    const flattened = model.rows.all().find((row) => row.isFlattened);
    expect(flattened?.path).toBe("src/lib/deep/nested/");
    expect(flattened?.flattenedSegments?.map(({ name }) => name)).toEqual([
      "lib",
      "deep",
      "nested",
    ]);

    note("`flattenEmptyDirectories: false` gives every directory its own row.");
    const unflattened = new Tree.Model({
      paths: project,
      initialExpansion: "open",
      flattenEmptyDirectories: false,
    });
    expect(unflattened.rows.paths()).toEqual([
      "src/",
      "src/components/",
      "src/components/Button.svelte",
      "src/components/Modal.svelte",
      "src/lib/",
      "src/lib/deep/",
      "src/lib/deep/nested/",
      "src/lib/deep/nested/only-child.ts",
      "src/index.ts",
      "README.md",
    ]);
    unflattened.dispose();
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="a sort comparator replaces the default ordering"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(
      new Pocket({
        paths: ["a.txt", "b.txt", "c.txt"],
        sort: (left, right) => right.basename.localeCompare(left.basename),
      }),
    );
    await mounted(delay, model);

    note("Each side carries basename, depth, path, segments and isDirectory.");
    expect(rendered.paths(model)).toEqual(["c.txt", "b.txt", "a.txt"]);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="density presets and itemHeight size every row"
  body={async ({ set, delay, expect, note }) => {
    const { model } = set(new Pocket({ paths: project, density: "compact" }));
    await mounted(delay, model);

    note("A keyword resolves to a preset item height plus a density factor.");
    expect(model.tree.getItemHeight()).toBe(density.presets.compact.itemHeight);
    expect(model.tree.getDensityFactor()).toBe(density.presets.compact.factor);

    note("The component publishes both to the host as CSS custom properties.");
    const style = model.tree.getFileTreeContainer()?.getAttribute("style") ?? "";
    expect(style).toContain(`--trees-item-height: ${density.presets.compact.itemHeight}px`);

    note("An explicit `itemHeight` wins over the preset.");
    const tall = new Tree.Model({ paths: project, itemHeight: 40 });
    expect(tall.tree.getItemHeight()).toBe(40);
    tall.dispose();
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>
