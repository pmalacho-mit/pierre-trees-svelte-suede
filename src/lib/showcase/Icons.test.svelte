<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree, icons } from "$release";
  import { mounted, once, rendered } from "../testing";
  import Panel from "./Panel.svelte";
  import { expanded, sampleFileList } from "./demo-data";

  const SETS = [
    {
      set: "minimal",
      description: "Generic file, folder, and image icons with no file types.",
    },
    { set: "standard", description: "Icons for common languages and file types." },
    { set: "complete", description: "Full, colored suite with brands and frameworks." },
  ] as const satisfies readonly { set: Tree.Icons & string; description: string }[];

  class Pocket {
    readonly model: Tree.Model;

    constructor(set: Tree.Icons) {
      this.model = new Tree.Model({
        paths: sampleFileList,
        flattenEmptyDirectories: true,
        initialExpandedPaths: expanded.source,
        icons: set,
        search: false,
      });
    }
  }

  const spriteIds = (markup: string) => [
    ...markup.matchAll(/<symbol id="([^"]+)"/g),
  ].map(([, id]) => id);
</script>

<Sweater config category="Built-in icon sets" />

{#each SETS as { set, description } (set)}
  <Sweater
    name={set}
    body={async ({ set: setPocket, delay, expect, note, capture }) => {
      const { model } = setPocket(new Pocket(set));
      await mounted(delay, model);
      await once(delay, () => rendered.rows(model).length > 0);

      note(`\`icons: '${set}'\` — ${description}`);
      const sprite = icons.spriteSheet(set);
      expect(spriteIds(sprite).length).toBeGreaterThan(0);

      note("Each set is a sprite sheet injected into the tree's shadow root.");
      const injected = model.tree.getFileTreeContainer()?.shadowRoot?.querySelector("svg[data-icon-sprite]");
      expect(injected).not.toBe(null);
      capture("png");
    }}
  >
    {#snippet vest({ model }: Pocket)}
      <Panel {model} title={set} {description} />
    {/snippet}
  </Sweater>
{/each}

<Sweater config category="Icon remapping" />

<Sweater
  name="a config remaps icons by name, extension or substring"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(
      new Pocket({
        set: "complete",
        colored: true,
        byFileName: { "package.json": "file-tree-icon-lock" },
        byFileExtension: { md: "file-tree-icon-dot" },
      }),
    );
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("`icons.resolver` answers the same question without needing a mounted tree.");
    const { resolveIcon } = icons.resolver({
      set: "complete",
      byFileName: { "package.json": "file-tree-icon-lock" },
      byFileExtension: { md: "file-tree-icon-dot" },
    });
    expect(resolveIcon("file-tree-icon-file", "package.json").name).toBe("file-tree-icon-lock");
    expect(resolveIcon("file-tree-icon-file", "README.md").name).toBe("file-tree-icon-dot");

    note("Anything unmapped keeps the set's own icon.");
    expect(resolveIcon("file-tree-icon-file", "src/index.ts").name).not.toBe(
      "file-tree-icon-dot",
    );
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel
      {model}
      title="Remapped"
      description="package.json wears a lock, every .md wears a dot"
    />
  {/snippet}
</Sweater>
