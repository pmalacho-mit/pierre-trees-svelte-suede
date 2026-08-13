<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree, density } from "$release";
  import { mounted, once, rendered } from "../testing";
  import Panel from "./Panel.svelte";
  import { expanded, sampleFileList } from "./demo-data";

  const SELECTED = "src/components/Button.tsx";

  const PRESETS = [
    { keyword: "compact", description: "24px rows, 0.8 spacing" },
    { keyword: "default", description: "30px rows, 1.0 spacing" },
    { keyword: "relaxed", description: "36px rows, 1.2 spacing" },
  ] as const;

  class Pocket {
    readonly model: Tree.Model;

    constructor(keyword: Tree.Density, itemHeight?: number) {
      this.model = new Tree.Model({
        paths: sampleFileList,
        flattenEmptyDirectories: true,
        initialExpandedPaths: expanded.source,
        density: keyword,
        itemHeight,
        search: false,
      });
    }
  }
</script>

<Sweater config category="Adjustable density" />

{#each PRESETS as { keyword, description } (keyword)}
  <Sweater
    name={keyword}
    body={async ({ set, delay, expect, note, capture }) => {
      const { model } = set(new Pocket(keyword));
      await mounted(delay, model);
      await once(delay, () => rendered.rows(model).length > 0);

      model.focus.at(SELECTED);
      model.selection.only(SELECTED);
      await delay({ frames: 4 });

      note(`\`density: '${keyword}'\` — ${description}.`);
      const preset = density.presets[keyword];
      expect(model.tree.getItemHeight()).toBe(preset.itemHeight);
      expect(model.tree.getDensityFactor()).toBe(preset.factor);

      note("The component publishes both to the host, so row height and spacing move together.");
      const host = model.tree.getFileTreeContainer();
      expect(host?.style.getPropertyValue("--trees-item-height")).toBe(
        `${preset.itemHeight}px`,
      );
      expect(rendered.row(model, SELECTED)?.style.minHeight).toBe(
        `${preset.itemHeight}px`,
      );
      capture("png");
    }}
  >
    {#snippet vest({ model }: Pocket)}
      <Panel {model} title={keyword} {description} />
    {/snippet}
  </Sweater>
{/each}

<Sweater config category="Custom density" />

<Sweater
  name="a number is a spacing factor, and row height stays a separate dial"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket(1.5, 44));
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("A numeric `density` sets the spacing factor only — anything between the keywords, and past them.");
    expect(model.tree.getDensityFactor()).toBe(1.5);

    note("Row height comes from `itemHeight`; without one a numeric density keeps the default 30px.");
    expect(model.tree.getItemHeight()).toBe(44);
    expect(new Pocket(1.5).model.tree.getItemHeight()).toBe(
      density.presets.default.itemHeight,
    );
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel
      {model}
      title="density: 1.5"
      description="44px rows, 1.5 spacing"
    />
  {/snippet}
</Sweater>
