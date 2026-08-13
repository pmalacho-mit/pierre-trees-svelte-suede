<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree, theme } from "$release";
  import { mounted, once, rendered } from "../testing";
  import Panel from "./Panel.svelte";
  import { expanded, gitStatuses, sampleFileList, themes } from "./demo-data";

  const LOOKS = [
    { title: "Dracula", source: themes.dracula, surface: "#21222c" },
    { title: "GitHub Light", source: themes.githubLight, surface: "#f6f8fa" },
  ] as const;

  class Pocket {
    readonly model: Tree.Model;

    constructor() {
      this.model = new Tree.Model({
        paths: sampleFileList,
        flattenEmptyDirectories: true,
        initialExpandedPaths: expanded.source,
        initialSelectedPaths: ["package.json"],
        gitStatus: gitStatuses,
        search: false,
      });
    }
  }
</script>

<Sweater config category="Use Shiki themes" />

{#each LOOKS as { title, source, surface } (title)}
  <Sweater
    name={title}
    body={async ({ set, delay, expect, note, capture }) => {
      const { model } = set(new Pocket());
      await mounted(delay, model);
      await once(delay, () => rendered.rows(model).length > 0);

      note("`theme.styles` maps a Shiki or VS Code theme onto the tree's own variables.");
      const styles = theme.styles(source);
      expect(styles["--trees-theme-sidebar-bg"]).toBe(surface);
      expect(styles.colorScheme).toBe(source.type);

      note("Git colours come from the theme's `gitDecoration.*` keys, so statuses match the editor.");
      expect(styles["--trees-theme-git-modified-fg"]).toBe(
        source.colors["gitDecoration.modifiedResourceForeground"],
      );

      note("`theme.css` is the same mapping as a style attribute — what this panel is wearing.");
      expect(theme.css(source)).toContain(`--trees-theme-sidebar-bg: ${surface}`);
      expect(model.tree.getFileTreeContainer()?.style.getPropertyValue("--trees-theme-sidebar-bg"))
        .toBe(surface);
      capture("png");
    }}
  >
    {#snippet vest({ model }: Pocket)}
      <Panel
        {model}
        {title}
        description="themeToTreeStyles, wrapped as theme.css"
        style="{theme.css(source)}; --panel-bg: {surface}; --panel-border: {source.colors['sideBar.border']}"
      />
    {/snippet}
  </Sweater>
{/each}
