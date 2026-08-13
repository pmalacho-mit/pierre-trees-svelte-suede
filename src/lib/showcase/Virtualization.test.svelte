<script lang="ts" module>
  import { Sweater } from "../../../sweater-vest-suede";
  import { Tree, input } from "$release";
  import { mounted, once, rendered } from "../testing";
  import Panel from "./Panel.svelte";

  const EXTENSIONS = [".ts", ".tsx", ".css", ".json", ".md", ".test.ts"];

  const PACKAGES = [
    "api", "auth", "cache", "cli", "config", "core", "crypto", "database",
    "email", "events", "gateway", "graphql", "hooks", "i18n", "icons", "jobs",
    "logging", "metrics", "models", "notifications", "payments", "permissions",
    "queue", "router", "scheduler", "search", "session", "storage", "testing",
    "types", "ui", "uploads",
  ];

  const MODULES = [
    "Button", "Card", "Dialog", "Dropdown", "Input", "Modal", "Select",
    "Sidebar", "Tabs", "Tooltip", "array", "cache", "color", "crypto", "date",
    "debounce", "dom", "event", "format", "hash", "http", "logger", "math",
    "merge", "parse", "path", "queue", "random", "schema", "string",
  ];

  /** ~50k paths, built the way the landing page builds its monorepo. */
  const monorepo = PACKAGES.flatMap((pkg) =>
    MODULES.flatMap((module) =>
      EXTENSIONS.flatMap((extension) =>
        Array.from(
          { length: 9 },
          (_, index) => `packages/${pkg}/src/${module}/${module}${index}${extension}`,
        ),
      ),
    ),
  );

  class Pocket {
    readonly model: Tree.Model;
    readonly built: number;

    constructor() {
      const startedAt = performance.now();
      this.model = new Tree.Model({
        preparedInput: input.prepare(monorepo),
        initialExpansion: "open",
        flattenEmptyDirectories: true,
        search: false,
      });
      this.built = performance.now() - startedAt;
    }
  }
</script>

<Sweater config category="Always virtualized" />

<Sweater
  name="tens of thousands of rows, a screenful of elements"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model, built } = set(new Pocket());
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    note(`${monorepo.length.toLocaleString()} paths became ${model.rows.count.toLocaleString()} visible rows in ${Math.round(built)}ms.`);
    expect(model.rows.count).toBeGreaterThan(50_000);

    note("Only the window around the scroll offset, plus overscan, exists in the DOM.");
    expect(rendered.rows(model).length).toBeLessThan(80);

    note("The model still answers about rows it never rendered — `slice` takes an inclusive range.");
    const head = model.rows.slice(0, 2);
    expect(head).toHaveLength(3);
    expect(head[0].path).toBe("packages/");
    expect(head[1].path.startsWith("packages/api/")).toBe(true);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel
      {model}
      title="A 50,000-file monorepo"
      description="Scrolling stays at frame rate because the row count never reaches the DOM"
    />
  {/snippet}
</Sweater>

<Sweater
  name="scrolling to a far-away path pulls it into the window"
  body={async ({ set, delay, expect, note, capture }) => {
    const { model } = set(new Pocket());
    await mounted(delay, model);
    await once(delay, () => rendered.rows(model).length > 0);

    const far = monorepo[monorepo.length - 1];
    expect(rendered.row(model, far)).toBe(null);

    model.scrollTo(far, { focus: true, offset: "center" });
    await once(delay, () => rendered.row(model, far) !== null);

    note("`scrollTo` renders the window it lands in, then focuses the row.");
    expect(model.focus.path).toBe(far);
    capture("png");
  }}
>
  {#snippet vest({ model }: Pocket)}
    <Panel
      {model}
      title="scrollTo"
      description="Jumping to the last file of the last package"
    />
  {/snippet}
</Sweater>
