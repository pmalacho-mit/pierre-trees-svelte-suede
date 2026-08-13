<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import { Tree, icons, theme } from "$release";
  import { mounted, rendered } from "./testing";

  const project = [
    "README.md",
    "src/index.ts",
    "src/components/Button.svelte",
  ];

  class Pocket {
    readonly model: Tree.Model;

    constructor(options: Tree.Options) {
      this.model = new Tree.Model({ initialExpansion: "open", ...options });
    }
  }

  const fill = "height: 100%; display: block;";
</script>

<Sweater config category="Presentation" orientation="vertical" />

<Sweater
  name="git status decorates rows and can be patched incrementally"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(
      new Pocket({
        paths: project,
        gitStatus: [
          { path: "README.md", status: "modified" },
          { path: "src/index.ts", status: "added" },
        ],
      }),
    );
    await mounted(delay, model);
    await delay({ frames: 2 });

    note("Each status lands on the row as `data-item-git-status`.");
    expect(rendered.gitStatuses(model)).toEqual({
      "README.md": "modified",
      "src/index.ts": "added",
    });

    note("`git.patch` edits entries without resending the whole set.");
    model.git.patch({
      set: [{ path: "src/components/Button.svelte", status: "untracked" }],
      remove: ["src/index.ts"],
    });
    await delay({ frames: 2 });
    expect(rendered.gitStatuses(model)).toEqual({
      "README.md": "modified",
      "src/components/Button.svelte": "untracked",
    });

    note("`git.set` replaces the set outright, and clears it when passed nothing.");
    model.git.set();
    await delay({ frames: 2 });
    expect(rendered.gitStatuses(model)).toEqual({});
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="renderRowDecoration owns a lane of its own on every row"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(
      new Pocket({
        paths: project,
        renderRowDecoration: ({ row }) =>
          row.kind === "file" ? { text: `${row.level}`, title: row.path } : null,
      }),
    );
    await mounted(delay, model);
    await delay({ frames: 2 });

    note("Returning `null` leaves a row undecorated; the lane sits beside git status.");
    expect(rendered.row(model, "README.md")?.textContent).toContain("0");
    expect(rendered.row(model, "src/components/Button.svelte")?.textContent).toContain(
      "2",
    );
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="icon sets are remappable by name, extension and substring"
  body={async ({ set, delay, expect, note }) => {
    const { model } = set(new Pocket({ paths: project, icons: "standard" }));
    await mounted(delay, model);
    await delay({ frames: 2 });

    note("`icons.spriteSheet` is the raw `<symbol>` markup a built-in set injects.");
    expect(icons.spriteSheet("minimal")).toContain(
      '<symbol id="file-tree-icon-chevron"',
    );

    note("`icons.resolver` answers what a config would draw, without a tree.");
    const resolve = icons.resolver({
      set: "standard",
      byFileExtension: { svelte: "flame" },
      byFileName: { "README.md": { name: "book", width: 12 } },
    }).resolveIcon;

    expect(resolve("file-tree-icon-file", "src/components/Button.svelte").name).toBe(
      "flame",
    );
    expect(resolve("file-tree-icon-file", "README.md")).toMatchObject({
      name: "book",
      width: 12,
    });

    note("Unmapped files keep the set's own icon.");
    expect(resolve("file-tree-icon-file", "src/index.ts").name).not.toBe("flame");

    note("`setIcons` swaps the configuration on a mounted tree, leaving the rows alone.");
    model.setIcons({ set: "none" });
    await delay({ frames: 2 });
    expect(model.rows.count).toBe(5);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="styling goes through CSS variables first and unsafeCSS last"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(
      new Pocket({
        paths: project,
        unsafeCSS: "[data-type='item'] { outline: 2px solid magenta; }",
      }),
    );
    await mounted(delay, model);
    await delay({ frames: 2 });

    note("`unsafeCSS` is injected into the shadow root, where row selectors reach.");
    expect(rendered.styleText(model)).toContain("magenta");

    note("`theme.css` turns a Shiki/VS Code theme into an inline style for the host.");
    const css = theme.css({
      type: "dark",
      colors: { "editor.background": "#101014", "editor.foreground": "#e6e6e6" },
    } as Tree.Theme);
    expect(css).toContain("--trees-theme-sidebar-bg: #101014");
    expect(css).not.toContain("colorScheme");

    note("`theme.styles` is the same mapping as an object, for `style:` directives.");
    expect(theme.styles({ type: "dark", colors: {} } as Tree.Theme)).toMatchObject({
      colorScheme: "dark",
    });
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>
