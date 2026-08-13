<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { ContextMenu, Tree } from "$release";
  import { themes, type Name } from "$release/themes";
  import { themeNames as shikiNames } from "@shikijs/themes";
  import { themeNames as pierreNames } from "@pierre/theme";
  import { asRgb, mounted, once, rendered, resolvedColor, rightClick } from "../testing";
  import Panel from "./Panel.svelte";
  import { expanded, gitStatuses, sampleFileList } from "./demo-data";

  const WEARING: readonly Name[] = ["dracula", "github-light", "pierre-dark"];

  class Pocket {
    readonly model: Tree.Model;
    style = $state("");

    constructor() {
      this.model = new Tree.Model({
        paths: sampleFileList,
        flattenEmptyDirectories: true,
        initialExpandedPaths: expanded.source,
        initialSelectedPaths: ["package.json"],
        gitStatus: gitStatuses,
        renaming: true,
        search: false,
        composition: { contextMenu: { enabled: true } },
      });
    }

    async wear(name: Name) {
      this.style = await themes.css(name);
    }
  }
</script>

<Sweater config category="Use Shiki themes" />

{#each WEARING as name (name)}
  <Sweater
    name={name}
    body={async ({ set, delay, expect, note, capture }) => {
      const pocket = set(new Pocket());
      const { model } = pocket;
      await pocket.wear(name);
      await mounted(delay, model);
      await once(delay, () => rendered.rows(model).length > 0);

      const { displayName, scheme, collection } = themes.describe(name);
      note(`\`${collection}\` collection, ${scheme} — ${displayName ?? name}.`);

      note("`themes.css(name)` loads the theme and maps it onto the tree's variables in one step.");
      const host = model.tree.getFileTreeContainer();
      const styles = await themes.styles(name);
      expect(host?.style.getPropertyValue("--trees-theme-sidebar-bg")).toBe(
        styles["--trees-theme-sidebar-bg"],
      );

      note("Git colours come from the theme, so a status letter matches the editor it came from.");
      expect(styles["--trees-theme-git-modified-fg"]).toBeTruthy();
      capture("png");
    }}
  >
    {#snippet vest(pocket: Pocket)}
      <Panel model={pocket.model} title={name} style={pocket.style}>
        {#snippet contextMenu(item, context)}
          <ContextMenu.Component
            {context}
            actions={ContextMenu.actions({ model: pocket.model, item, context })}
          />
        {/snippet}
      </Panel>
    {/snippet}
  </Sweater>
{/each}

<Sweater config category="Theming and the context menu" />

<Sweater
  name="the menu wears the same theme the tree does"
  body={async ({ set, delay, expect, note, capture }) => {
    const pocket = set(new Pocket());
    const { model } = pocket;
    await pocket.wear("dracula");
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    const row = rendered.row(model, "src/components/Button.tsx");
    if (!row) throw new Error("expected a row for Button.tsx");
    rightClick(row);
    await once(delay, () => rendered.contextMenuSlot(model).length > 0);
    await delay({ frames: 4 });

    const menu = rendered.contextMenu(model);
    if (!menu) throw new Error("expected an open menu");
    const painted = getComputedStyle(menu);

    note("The tree declares its resolved variables on `:host`, and the menu is a light-DOM child of that host — so they inherit.");
    const resolved = (name: string) => resolvedColor(menu, name);

    note("A menu is a raised surface, so it takes the tree's input colours rather than its page background.");
    expect(painted.backgroundColor).toBe(resolved("--trees-search-bg"));
    expect(painted.color).toBe(resolved("--trees-search-fg"));

    note("Its border is the tree's border, and its destructive colour is the theme's git-deleted red.");
    expect(painted.borderTopColor).toBe(resolved("--trees-border-color"));
    const danger = menu.querySelector<HTMLElement>("button.danger");
    expect(danger && getComputedStyle(danger).color).toBe(
      resolved("--trees-status-deleted"),
    );

    note("Every one of those traces back to the theme — `--trees-status-deleted` resolves through `--trees-theme-git-deleted-fg`.");
    const styles = await themes.styles("dracula");
    expect(resolved("--trees-status-deleted")).toBe(
      asRgb(styles["--trees-theme-git-deleted-fg"]!),
    );

    note("Nothing wired that up: no `--trees-menu-*` was set anywhere in this test.");
    capture("png");
  }}
>
  {#snippet vest(pocket: Pocket)}
    <Panel model={pocket.model} title="dracula" style={pocket.style}>
      {#snippet contextMenu(item, context)}
        <ContextMenu.Component
          {context}
          actions={ContextMenu.actions({ model: pocket.model, item, context })}
        />
      {/snippet}
    </Panel>
  {/snippet}
</Sweater>

<Sweater
  name="a --trees-menu-* override still wins over the theme"
  body={async ({ set, delay, expect, note, capture }) => {
    const pocket = set(new Pocket());
    const { model } = pocket;
    await pocket.wear("dracula");
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    const row = rendered.row(model, "src/components/Card.tsx");
    if (!row) throw new Error("expected a row for Card.tsx");
    rightClick(row);
    await once(delay, () => rendered.contextMenuSlot(model).length > 0);
    await delay({ frames: 4 });

    const menu = rendered.contextMenu(model);
    note("The theme is the default, not the ceiling.");
    expect(menu && getComputedStyle(menu).backgroundColor).toBe(
      asRgb("rgb(255, 0, 128)"),
    );
    capture("png");
  }}
>
  {#snippet vest(pocket: Pocket)}
    <Panel model={pocket.model} title="overridden" style={pocket.style}>
      {#snippet contextMenu(item, context)}
        <ContextMenu.Component
          {context}
          actions={ContextMenu.actions({ model: pocket.model, item, context })}
          --trees-menu-bg="rgb(255, 0, 128)"
        />
      {/snippet}
    </Panel>
  {/snippet}
</Sweater>

<Sweater config category="Theme catalog" />

<Sweater
  name="the catalog is every theme both packages ship"
  body={async ({ set, delay, expect, note }) => {
    set(new Pocket());
    await delay({ frames: 1 });

    note("Each theme sits behind its own dynamic import, so a build carries only the ones it loads.");
    expect([...themes.names({ collection: "shiki" })].sort()).toEqual(
      [...shikiNames].sort(),
    );
    expect([...themes.names({ collection: "pierre" })].sort()).toEqual(
      [...pierreNames].sort(),
    );

    note(`${themes.names().length} in total — ${themes.names({ scheme: "light" }).length} light, ${themes.names({ scheme: "dark" }).length} dark.`);
    expect(themes.names().length).toBe(shikiNames.length + pierreNames.length);

    note("`describe` carries what a theme picker needs.");
    expect(themes.describe("pierre-dark-soft")).toEqual({
      name: "pierre-dark-soft",
      collection: "pierre",
      scheme: "dark",
      displayName: "Pierre Dark Soft",
    });
  }}
>
  {#snippet vest(pocket: Pocket)}
    <Panel model={pocket.model} title="catalog" style={pocket.style} />
  {/snippet}
</Sweater>
