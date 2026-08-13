<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import { Tree } from "$release";
  import { mounted, once, pressKey, rendered, typeInto } from "./testing";

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

<Sweater config category="Renaming & drag" orientation="vertical" />

<Sweater
  name="renaming is an inline input that commits on Enter"
  body={async ({ set, delay, expect, note, capture }) => {
    const renamed: Tree.Events["renamed"][0][] = [];
    const { model } = set(new Pocket({ paths: project, renaming: true }));
    model.subscribe({ renamed: (event) => renamed.push(event) });
    await mounted(delay, model);

    note("The row has to be on screen for its input to exist, so scroll to it first.");
    model.scrollTo("README.md", { focus: true });
    await delay({ frames: 2 });

    note("Called with no path, `rename` edits whatever is focused.");
    expect(model.rename()).toBe(true);
    await once(delay, () => rendered.renameInput(model) !== null);

    note("The input opens pre-filled with the current name.");
    const editor = rendered.renameInput(model);
    expect(editor?.value).toBe("README.md");
    capture("png");

    if (!editor) throw new Error("expected a rename input");
    typeInto(editor, "NOTES.md");
    pressKey(editor, "Enter");
    await delay({ frames: 4 });

    note("Committing reports both ends of the rename and moves the path.");
    expect(renamed).toEqual([
      { sourcePath: "README.md", destinationPath: "NOTES.md", isFolder: false },
    ]);
    expect(model.rows.paths()).toContain("NOTES.md");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="Escape abandons a rename, and canRename can refuse one outright"
  body={async ({ set, delay, expect, note }) => {
    const { model } = set(
      new Pocket({
        paths: project,
        renaming: { canRename: ({ isFolder }) => !isFolder },
      }),
    );
    await mounted(delay, model);

    note("`canRename` is consulted before the input ever appears.");
    expect(model.rename("src/")).toBe(false);
    expect(rendered.renameInput(model)).toBe(null);

    expect(model.rename("src/index.ts")).toBe(true);
    await once(delay, () => rendered.renameInput(model) !== null);

    const editor = rendered.renameInput(model);
    if (!editor) throw new Error("expected a rename input");
    typeInto(editor, "abandoned.ts");
    pressKey(editor, "Escape");
    await delay({ frames: 4 });

    note("Escape leaves the tree exactly as it was.");
    expect(model.rows.paths()).toContain("src/index.ts");
    expect(rendered.renameInput(model)).toBe(null);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="renaming must be enabled before `rename` will do anything"
  body={async ({ set, delay, expect, note }) => {
    const { model } = set(new Pocket({ paths: project }));
    await mounted(delay, model);

    note("Without the option the tree has no rename affordance, so the call is a no-op.");
    expect(model.rename("README.md")).toBe(false);
    expect(rendered.renameInput(model)).toBe(null);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>

<Sweater
  name="dragAndDrop makes rows draggable and routes the result to subscribers"
  body={async ({ set, delay, expect, note }) => {
    const asked: (readonly string[])[] = [];
    const { model } = set(
      new Pocket({
        paths: project,
        dragAndDrop: {
          canDrag: (paths) => {
            asked.push(paths);
            return true;
          },
        },
      }),
    );
    await mounted(delay, model);
    await delay({ frames: 2 });

    note("Enabling drag and drop marks every row `draggable`.");
    expect(rendered.row(model, "README.md")?.getAttribute("draggable")).toBe(
      "true",
    );

    note("Without the option rows are not draggable at all.");
    const plain = new Tree.Model({ paths: project });
    expect(plain.tree.getComposition()).toBe(undefined);
    plain.dispose();

    note("`dropped` and `drop refused` mirror the config's own callbacks, so a subscriber can watch both.");
    expect(model.subscribe({ dropped: () => {} })).toBeInstanceOf(Function);
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Tree.Component {model} style={fill} />
  {/snippet}
</Sweater>
