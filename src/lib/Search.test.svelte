<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import { Tree } from "$release";
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
      this.model = new Tree.Model({ initialExpansion: "open", ...options });
    }
  }

  const rowsMatching = (query: string, mode: Tree.SearchMode) => {
    const probe = new Tree.Model({
      paths: project,
      fileTreeSearchMode: mode,
      initialSearchQuery: query,
    });
    const paths = probe.rows.paths();
    probe.dispose();
    return paths;
  };

  const fill = "height: 100%; display: block;";
</script>

<Sweater config category="Search" orientation="vertical" />

<Sweater
  name="a search narrows the tree and reports what matched"
  body={async ({ set, delay, expect, note, capture }) => {
    const queries: (string | null)[] = [];
    const { model } = set(new Pocket({ paths: project }));
    model.subscribe({ "search changed": (value) => queries.push(value) });
    await mounted(delay, model);

    model.search.set("button");
    await delay({ frames: 2 });

    note("Matching is by path, so ancestors stay on screen to reach the match.");
    expect(model.search.isOpen).toBe(true);
    expect(model.search.value).toBe("button");
    expect(model.search.matches).toEqual(["src/components/Button.svelte"]);
    expect(model.rows.paths()).toEqual([
      "src/",
      "src/components/",
      "src/components/Button.svelte",
    ]);

    note("`null` ends the session; `''` keeps it open with an empty query.");
    model.search.set(null);
    await delay({ frames: 2 });
    expect(model.search.isOpen).toBe(false);
    expect(model.rows.count).toBe(8);
    expect(queries).toEqual(["button", null]);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="fileTreeSearchMode decides what happens to the rows that did not match"
  body={async ({ set, delay, expect, note }) => {
    const { model } = set(new Pocket({ paths: project }));
    await mounted(delay, model);

    note("`hide-non-matches` (the default) keeps only matches and their ancestors.");
    expect(rowsMatching("button", "hide-non-matches")).toEqual([
      "src/",
      "src/components/",
      "src/components/Button.svelte",
    ]);

    note("`expand-matches` leaves the tree intact and opens the way to each match.");
    expect(rowsMatching("button", "expand-matches")).toContain("README.md");

    note("`collapse-non-matches` keeps siblings but shuts the branches without matches.");
    expect(rowsMatching("button", "collapse-non-matches")).toContain(
      "src/components/Button.svelte",
    );

    model.search.set("button");
    await delay({ frames: 2 });
    expect(model.rows.paths()).toEqual(
      rowsMatching("button", "hide-non-matches"),
    );
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="focusNext and focusPrevious step through the matches"
  body={async ({ set, delay, expect, note }) => {
    const { model } = set(new Pocket({ paths: project }));
    await mounted(delay, model);

    model.search.set("svelte");
    await delay({ frames: 2 });
    expect(model.search.matches).toEqual([
      "src/components/Button.svelte",
      "src/components/Modal.svelte",
    ]);

    model.focus.at("src/components/Button.svelte");
    model.search.focusNext();
    await delay({ frames: 2 });
    expect(model.focus.path).toBe("src/components/Modal.svelte");

    note("Stepping clamps at either end rather than wrapping around.");
    model.search.focusNext();
    await delay({ frames: 2 });
    expect(model.focus.path).toBe("src/components/Modal.svelte");

    model.search.focusPrevious();
    await delay({ frames: 2 });
    expect(model.focus.path).toBe("src/components/Button.svelte");

    note("The query itself is untouched by stepping.");
    expect(model.search.value).toBe("svelte");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="`search: true` renders the tree's own search input"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(
      new Pocket({ paths: project, search: true, searchFakeFocus: true }),
    );
    await mounted(delay, model);
    await delay({ frames: 4 });

    note("With the input on screen the user drives the session; the model still reads it.");
    expect(rendered.searchInput(model)).not.toBe(null);

    note("`searchBlurBehavior` decides whether losing focus ends the session — outside of a focused page, `'close'` ends it immediately.");
    expect(model.search.isOpen).toBe(false);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>
