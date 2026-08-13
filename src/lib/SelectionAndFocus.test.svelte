<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import { Tree } from "$release";
  import { mounted, rendered } from "./testing";

  const project = [
    "README.md",
    "src/index.ts",
    "src/components/Button.svelte",
    "src/components/Modal.svelte",
  ];

  class Pocket {
    readonly model: Tree.Model;

    constructor(options: Tree.Options) {
      this.model = new Tree.Model({ initialExpansion: "open", ...options });
    }
  }

  const fill = "height: 100%; display: block;";
</script>

<Sweater config category="Selection & focus" orientation="vertical" />

<Sweater
  name="selection is reactive state, readable straight from the model"
  body={async ({ set, delay, expect, note, capture }) => {
    const announced: (readonly string[])[] = [];
    const { model } = set(
      new Pocket({ paths: project, initialSelectedPaths: ["README.md"] }),
    );
    model.subscribe({ "selection changed": (paths) => announced.push(paths) });
    await mounted(delay, model);

    note("`initialSelectedPaths` seeds the selection before the first render.");
    expect(model.selection.paths).toEqual(["README.md"]);

    model.selection.add("src/index.ts");
    await delay({ frames: 2 });

    note("The DOM carries `data-item-selected`, and the model carries the paths.");
    expect(model.selection.paths).toEqual(["README.md", "src/index.ts"]);
    expect(rendered.selected(model).sort()).toEqual([
      "README.md",
      "src/index.ts",
    ]);
    expect(announced.at(-1)).toEqual(["README.md", "src/index.ts"]);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="toggle, only and clear are the three ways to move a selection"
  body={async ({ set, delay, expect, note }) => {
    const { model } = set(new Pocket({ paths: project }));
    await mounted(delay, model);

    model.selection.toggle("README.md");
    await delay({ frames: 1 });
    expect(model.selection.has("README.md")).toBe(true);

    model.selection.toggle("README.md");
    await delay({ frames: 1 });
    expect(model.selection.paths).toEqual([]);

    note("`only` collapses whatever was selected down to a single path.");
    model.selection.add("src/index.ts");
    model.selection.only("README.md");
    await delay({ frames: 1 });
    expect(model.selection.paths).toEqual(["README.md"]);

    model.selection.clear();
    await delay({ frames: 1 });
    expect(model.selection.paths).toEqual([]);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="focus walks the visible rows, not the underlying paths"
  body={async ({ set, delay, expect, note, capture }) => {
    const visited: (string | null)[] = [];
    const { model } = set(new Pocket({ paths: project }));
    model.subscribe({ "focus changed": (path) => visited.push(path) });
    await mounted(delay, model);

    note("A tree focuses its first row on construction, so `first` is already where we are.");
    expect(model.focus.path).toBe("src/");

    model.focus.first();
    await delay({ frames: 1 });
    expect(model.focus.index).toBe(0);

    model.focus.next();
    model.focus.next();
    await delay({ frames: 1 });
    expect(model.focus.path).toBe("src/components/Button.svelte");

    note("`parent` climbs to the containing directory.");
    model.focus.parent();
    await delay({ frames: 1 });
    expect(model.focus.path).toBe("src/components/");

    model.focus.last();
    await delay({ frames: 1 });
    expect(model.focus.path).toBe("README.md");

    note("Every move is announced once, in order, and a no-op move announces nothing.");
    expect(visited).toEqual([
      "src/components/",
      "src/components/Button.svelte",
      "src/components/",
      "README.md",
    ]);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="item handles expose the per-row commands"
  body={async ({ set, delay, expect, note }) => {
    const { model } = set(new Pocket({ paths: project }));
    await mounted(delay, model);

    const directory = model.item("src/components/");
    note("`isDirectory()` narrows the handle, so `expand` and `collapse` typecheck.");
    if (!directory?.isDirectory()) throw new Error("expected a directory");

    expect(directory.isExpanded()).toBe(true);
    directory.collapse();
    await delay({ frames: 2 });
    expect(model.rows.paths()).not.toContain("src/components/Button.svelte");

    directory.toggle();
    await delay({ frames: 2 });
    expect(model.rows.paths()).toContain("src/components/Button.svelte");

    note("A bare directory name resolves to its canonical trailing-slash path.");
    expect(model.item("src")?.getPath()).toBe("src/");
    expect(model.item("nope.txt")).toBe(null);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>
