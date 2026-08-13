<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree } from "$release";
  import { mounted, once, rendered } from "../testing";
  import Panel from "./Panel.svelte";
  import { expanded, gitStatuses, sampleFileList } from "./demo-data";

  const changed = new Set(gitStatuses.map(({ path }) => path));

  const onlyChanges = sampleFileList.filter(
    (path) => changed.has(path) || path.startsWith("node_modules/"),
  );

  class Pocket {
    readonly model: Tree.Model;

    constructor(paths: readonly string[] = sampleFileList) {
      this.model = new Tree.Model({
        paths,
        flattenEmptyDirectories: true,
        initialExpandedPaths: expanded.source,
        gitStatus: gitStatuses,
        search: false,
      });
    }
  }
</script>

<Sweater config category="Show Git status on files" />

<Sweater
  name="every status has its own lane, colour and letter"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket());
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("`gitStatus` is a flat list of `{ path, status }`; the tree places each on its row.");
    expect(rendered.gitStatuses(model)).toMatchObject({
      "README.md": "untracked",
      "package.json": "renamed",
      "src/index.ts": "modified",
      "src/components/Button.tsx": "added",
      ".gitignore": "deleted",
    });

    note("A directory entry (`node_modules/`) styles everything beneath it as ignored.");
    expect(rendered.row(model, "node_modules/")?.dataset.itemGitStatus).toBe("ignored");

    note("Directories containing a change are marked so a collapsed folder still shows it.");
    expect(rendered.row(model, "src/")?.dataset.itemContainsGitChange).toBe("true");
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel {model} title="Full tree" description="Every file, decorated in place" />
  {/snippet}
</Sweater>

<Sweater
  name="hiding unmodified files leaves the statuses untouched"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket(onlyChanges));
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note("Status lives on paths, not rows, so filtering the input list changes nothing about it.");
    expect(rendered.gitStatuses(model)).toMatchObject({
      "README.md": "untracked",
      "src/index.ts": "modified",
    });
    expect(model.rows.paths()).not.toContain("src/lib/utils.ts");

    note("`git.patch` edits the set afterwards without resending it.");
    model.git.patch({ set: [{ path: "README.md", status: "modified" }] });
    await delay({ frames: 4 });
    expect(rendered.gitStatuses(model)["README.md"]).toBe("modified");
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel {model} title="Changes only" description="The same statuses, fewer rows" />
  {/snippet}
</Sweater>
