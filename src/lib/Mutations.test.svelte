<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import { Tree, input } from "$release";
  import { mounted, rendered } from "./testing";

  const project = [
    "README.md",
    "src/index.ts",
    "src/components/Button.svelte",
    "src/components/Modal.svelte",
  ];

  class Pocket {
    readonly model: Tree.Model;
    readonly seen: string[] = [];

    constructor(options: Tree.Options) {
      this.model = new Tree.Model(options);
      this.model.subscribe({
        added: ({ path }) => this.seen.push(`added ${path}`),
        removed: ({ path, recursive }) =>
          this.seen.push(`removed ${path}${recursive ? " recursively" : ""}`),
        moved: ({ from, to }) => this.seen.push(`moved ${from} -> ${to}`),
        reset: ({ pathCountBefore, pathCountAfter }) =>
          this.seen.push(`reset ${pathCountBefore} -> ${pathCountAfter}`),
        batched: ({ events }) => this.seen.push(`batched ${events.length}`),
      });
    }
  }

  const opened = (paths: readonly string[]) => ({
    paths,
    initialExpansion: "open" as const,
  });

  const fill = "height: 100%; display: block;";
</script>

<Sweater config category="Mutations" orientation="vertical" />

<Sweater
  name="add inserts a path and announces it"
  body={async ({ set, delay, expect, note, capture }) => {
    const pocket = set(new Pocket(opened(project)));
    const { model, seen } = pocket;
    await mounted(delay, model);

    model.add("src/components/Table.svelte");
    await delay({ frames: 2 });

    note("The new row lands in sorted position, not at the end.");
    expect(rendered.paths(model)).toContain("src/components/Table.svelte");
    expect(seen).toEqual(["added src/components/Table.svelte"]);

    note("Adding a nested path creates the directories it needs.");
    model.add("docs/api/reference.md");
    await delay({ frames: 2 });
    expect(model.rows.paths()).toContain("docs/api/");
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="remove needs `recursive` to take a populated directory with it"
  body={async ({ set, delay, expect, note }) => {
    const { model, seen } = set(new Pocket(opened(project)));
    await mounted(delay, model);

    model.remove("src/components/", { recursive: true });
    await delay({ frames: 2 });

    note("The directory and everything under it leave in a single event.");
    expect(model.rows.paths()).toEqual(["src/", "src/index.ts", "README.md"]);
    expect(seen).toEqual(["removed src/components/ recursively"]);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="move renames a path and everything beneath it"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model, seen } = set(new Pocket(opened(project)));
    await mounted(delay, model);

    model.move("src/components/", "src/ui/");
    await delay({ frames: 2 });

    note("Descendants follow the directory to its new path.");
    expect(model.rows.paths()).toEqual([
      "src/",
      "src/ui/",
      "src/ui/Button.svelte",
      "src/ui/Modal.svelte",
      "src/index.ts",
      "README.md",
    ]);
    expect(seen).toEqual(["moved src/components/ -> src/ui/"]);

    note("`collision` chooses what happens when the destination already exists.");
    model.move("src/index.ts", "README.md", { collision: "skip" });
    await delay({ frames: 2 });
    expect(model.rows.paths()).toContain("src/index.ts");
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="batch applies many operations as one invalidation"
  body={async ({ set, delay, expect, note }) => {
    const { model, seen } = set(new Pocket(opened(project)));
    await mounted(delay, model);

    model.batch([
      { type: "add", path: "docs/guide.md" },
      { type: "move", from: "README.md", to: "docs/README.md" },
      { type: "remove", path: "src/components/", recursive: true },
    ]);
    await delay({ frames: 2 });

    note("Subscribers hear one `batched` event carrying the individual operations.");
    expect(seen).toEqual(["batched 3"]);
    expect(model.rows.paths()).toEqual([
      "docs/",
      "docs/guide.md",
      "docs/README.md",
      "src/",
      "src/index.ts",
    ]);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="reset swaps the whole path set, optionally from prepared input"
  body={async ({ set, delay, expect, note }) => {
    const { model, seen } = set(new Pocket(opened(project)));
    await mounted(delay, model);

    model.reset(["a.txt", "b/c.txt"]);
    await delay({ frames: 2 });

    note("A reset reports how many paths it replaced.");
    expect(seen).toEqual([`reset ${project.length} -> 2`]);
    expect(model.rows.paths()).toEqual(["b/", "b/c.txt", "a.txt"]);

    note("`input.prepare` does the sorting and flattening work once, up front.");
    const prepared = input.prepare(["x/y.ts", "z.ts"]);
    model.reset({ preparedInput: prepared });
    await delay({ frames: 2 });
    expect(model.rows.paths()).toEqual(["x/", "x/y.ts", "z.ts"]);

    note("`input.presorted` skips the sort when the order is already final.");
    expect(input.presorted(["z.ts", "x/y.ts"]).paths).toEqual([
      "z.ts",
      "x/y.ts",
    ]);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="every mutation also arrives on the `mutated` channel"
  body={async ({ set, delay, expect, note }) => {
    const operations: string[] = [];
    const { model } = set(new Pocket(opened(project)));
    model.subscribe({ mutated: ({ operation }) => operations.push(operation) });
    await mounted(delay, model);

    model.add("one.txt");
    model.remove("one.txt");
    model.batch([{ type: "add", path: "two.txt" }]);
    await delay({ frames: 2 });

    note("Useful when a listener does not care which kind of change it was.");
    expect(operations).toEqual(["add", "remove", "batch"]);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>
