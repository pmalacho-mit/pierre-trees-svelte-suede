<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree } from "$release";
  import { mounted, once, rendered } from "../testing";
  import Panel from "./Panel.svelte";
  import { asStyle, expanded, palettes, sampleFileList } from "./demo-data";

  const LOOKS = [
    { name: "Light mode", palette: palettes.light, selected: "src/index.ts" },
    {
      name: "Dark mode",
      palette: palettes.dark,
      selected: "src/components/Card.tsx",
    },
    { name: "Synthwave '84", palette: palettes.synthwave, selected: "package.json" },
  ] as const;

  class Pocket {
    readonly model: Tree.Model;

    constructor(selected: string) {
      this.model = new Tree.Model({
        paths: sampleFileList,
        flattenEmptyDirectories: true,
        initialExpandedPaths: expanded.source,
        initialSelectedPaths: [selected],
        search: false,
      });
    }
  }
</script>

<Sweater config category="Style with CSS variables" />

{#each LOOKS as { name, palette, selected } (name)}
  <Sweater
    name={name}
    body={async ({ set, delay, expect, note, capture }) => {
      const { model } = set(new Pocket(selected));
      await mounted(delay, model);
      await once(delay, () => rendered.rows(model).length > 0);

      note("Every colour is a `--trees-*-override` on the host — no stylesheet reaches inside the shadow root.");
      const host = model.tree.getFileTreeContainer();
      expect(host?.style.getPropertyValue("--trees-bg-override")).toBe(
        palette["--trees-bg-override"],
      );

      note("The selected row is what shows the selection half of a palette off.");
      expect(rendered.selected(model)).toEqual([selected]);
      capture("png");
    }}
  >
    {#snippet vest({ model }: Pocket)}
      <Panel {model} title={name} style={asStyle(palette)} />
    {/snippet}
  </Sweater>
{/each}
