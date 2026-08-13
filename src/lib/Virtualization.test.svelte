<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import { Tree, input } from "$release";
  import { mounted, rendered } from "./testing";

  const many = Array.from(
    { length: 2000 },
    (_, index) => `pkg/${String(index).padStart(4, "0")}/file.ts`,
  );

  class Pocket {
    readonly model: Tree.Model;

    constructor(options: Tree.Options) {
      this.model = new Tree.Model({
        initialExpansion: "open",
        flattenEmptyDirectories: false,
        ...options,
      });
    }
  }

  const viewport = "height: 300px; display: block;";
</script>

<Sweater config category="Virtualization" orientation="vertical" />

<Sweater
  name="only the rows near the viewport reach the DOM"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket({ paths: many }));
    await mounted(delay, model);
    await delay({ frames: 4 });

    note("2,000 files under 2,000 directories is 4,001 visible rows.");
    expect(model.rows.count).toBe(4001);

    note("The tree renders a window around the scroll offset plus an overscan margin.");
    expect(rendered.rows(model).length).toBeLessThan(60);
    expect(rendered.rows(model).length).toBeGreaterThan(0);

    note("`rows.slice(first, last)` reads any window from the model, mounted or not — both ends inclusive.");
    expect(model.rows.slice(0, 2).map(({ path }) => path)).toEqual([
      "pkg/",
      "pkg/0000/",
      "pkg/0000/file.ts",
    ]);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={viewport} />
  {/snippet}
</Sweater>

<Sweater
  name="scrollTo brings a far-away path into the window"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket({ paths: many }));
    await mounted(delay, model);
    await delay({ frames: 4 });

    expect(rendered.row(model, "pkg/1500/file.ts")).toBe(null);

    model.scrollTo("pkg/1500/file.ts", { focus: true, offset: "center" });
    await delay({ frames: 8 });

    note("`focus: true` also moves keyboard focus to the row it scrolled to.");
    expect(model.focus.path).toBe("pkg/1500/file.ts");
    expect(rendered.row(model, "pkg/1500/file.ts")).not.toBe(null);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={viewport} />
  {/snippet}
</Sweater>

<Sweater
  name="prepared input moves the sorting cost off the render path"
  body={async ({ set, delay, expect, note }) => {
    const prepared = input.prepare(many, { flattenEmptyDirectories: false });
    const { model } = set(new Pocket({ preparedInput: prepared }));
    await mounted(delay, model);
    await delay({ frames: 4 });

    note("A prepared input can be built once and handed to as many trees as you like.");
    expect(model.rows.count).toBe(4001);
    expect(prepared.paths.length).toBeGreaterThan(0);

    note("Reusing it for a reset reports that the prepared path was taken.");
    const usedPrepared: boolean[] = [];
    model.subscribe({ reset: (event) => usedPrepared.push(event.usedPreparedInput) });
    model.reset({ preparedInput: prepared });
    await delay({ frames: 4 });
    expect(usedPrepared).toEqual([true]);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={viewport} />
  {/snippet}
</Sweater>
