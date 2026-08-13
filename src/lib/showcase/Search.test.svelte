<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree } from "$release";
  import { mounted, once, rendered } from "../testing";
  import Panel from "./Panel.svelte";
  import { expanded, sampleFileList } from "./demo-data";

  const QUERY = "tsx";

  const MODES = [
    {
      mode: "hide-non-matches",
      description: "Hides files and folders without any matches",
      /** `public/` holds no `.tsx`, and `public/404.html` is inside it. */
      keepsFolder: false,
      keepsFile: false,
    },
    {
      mode: "collapse-non-matches",
      description: "Collapses folders without any matches",
      keepsFolder: true,
      keepsFile: false,
    },
    {
      mode: "expand-matches",
      description: "Keeps all items visible and expands folders that have matches",
      keepsFolder: true,
      keepsFile: true,
    },
  ] as const satisfies readonly {
    mode: Tree.SearchMode;
    description: string;
    keepsFolder: boolean;
    keepsFile: boolean;
  }[];

  class Pocket {
    readonly model: Tree.Model;

    constructor(fileTreeSearchMode: Tree.SearchMode) {
      this.model = new Tree.Model({
        paths: sampleFileList,
        flattenEmptyDirectories: true,
        fileTreeSearchMode,
        // Pre-expanding two folders with no `.tsx` in them is what makes
        // collapse-non-matches and expand-matches tell themselves apart.
        initialExpandedPaths: expanded.withoutMatches,
        initialSearchQuery: QUERY,
        search: true,
        searchFakeFocus: true,
        searchBlurBehavior: "retain",
      });
    }
  }
</script>

<Sweater config category="Search and filter by name" />

{#each MODES as { mode, description, keepsFolder, keepsFile } (mode)}
  <Sweater
    name={mode}
    body={async ({ set, delay, expect, note, capture }) => {
      const { model } = set(new Pocket(mode));
      await mounted(delay, model);
      await once(delay, () => rendered.rows(model).length > 0);

      note(`\`fileTreeSearchMode: '${mode}'\` — ${description[0].toLowerCase()}${description.slice(1)}.`);
      expect(model.search.matches).toEqual([
        "src/components/Button.tsx",
        "src/components/Card.tsx",
        "src/components/Header.tsx",
        "src/components/Sidebar.tsx",
        "src/lib/mdx.tsx",
      ]);

      note("`initialSearchQuery` opens the session before the first paint, so the tree arrives filtered.");
      const shown = model.rows.paths();
      expect(shown).toContain("src/components/Button.tsx");

      note("`public/` was pre-expanded and holds no match, which is what tells the three modes apart.");
      expect(shown.includes("public/")).toBe(keepsFolder);
      expect(shown.includes("public/404.html")).toBe(keepsFile);
      capture("png");
    }}
  >
    {#snippet vest({ model }: Pocket)}
      <Panel {model} title={mode} {description} />
    {/snippet}
  </Sweater>
{/each}
