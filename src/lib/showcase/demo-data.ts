import type { Tree } from "$release";

/** The file list every example on https://trees.software/ is built from. */
export const sampleFileList: string[] = [
  "README.md",
  "package.json",
  "bunfig.toml",
  "stylelint.config.js",
  ".browserslistrc",
  ".oxlintrc.json",
  ".github/workflows/ci.yml",
  "build/index.mjs",
  "build/scripts.js",
  "build/assets/images/social/logo.png",
  "config/project/app.config.json",
  "public/404.html",
  "public/favicon.ico",
  "scripts/deploy.sh",
  "src/components/Button.tsx",
  "src/components/Card.tsx",
  "src/components/Header.tsx",
  "src/components/Sidebar.tsx",
  "src/lib/mdx.tsx",
  "src/lib/utils.ts",
  "src/styles/globals.css",
  "src/utils/stream.ts",
  "src/utils/worker.ts",
  "src/utils/worker/index.ts",
  "src/utils/worker/deprecrated/old-worker.ts",
  "src/index.ts",
  ".gitignore",
  "node_modules/react/package.json",
  "node_modules/react/index.js",
  "node_modules/react-dom/package.json",
  "node_modules/react-dom/index.js",
  "node_modules/typescript/package.json",
];

export const gitStatuses: Tree.GitEntry[] = [
  { path: "README.md", status: "untracked" },
  { path: "package.json", status: "renamed" },
  { path: "node_modules/", status: "ignored" },
  { path: "src/index.ts", status: "modified" },
  { path: "src/components/Button.tsx", status: "added" },
  { path: ".gitignore", status: "deleted" },
];

export const expanded = {
  source: ["src", "src/components"],
  hierarchicalBuild: [
    "build",
    "build/assets",
    "build/assets/images",
    "build/assets/images/social",
  ],
  flattenedBuild: ["build", "build/assets/images/social"],
  withoutMatches: ["public/", "node_modules/react/"],
} as const;

/**
 * The `--trees-*-override` palettes behind "Style with CSS variables", each
 * paired with the panel chrome the docs frame it in. A tree wearing one owes
 * nothing to the page around it.
 */
export const palettes = {
  light: {
    "color-scheme": "light",
    "--panel-bg": "oklch(98.5% 0 0)",
    "--panel-border": "oklch(92.2% 0 0)",
    "--trees-bg-override": "oklch(98.5% 0 0)",
    "--trees-fg-override": "oklch(14.5% 0 0)",
    "--trees-fg-muted-override": "oklch(45% 0 0)",
    "--trees-bg-muted-override": "oklch(96% 0 0)",
    "--trees-search-fg-override": "oklch(30% 0 0)",
    "--trees-search-bg-override": "oklch(100% 0 0)",
    "--trees-border-color-override": "oklch(92% 0 0)",
    "--trees-selected-fg-override": "oklch(20% 0.08 250)",
    "--trees-selected-bg-override": "oklch(92% 0.06 250)",
    "--trees-selected-border-color-override": "oklch(65% 0.15 250)",
    "--trees-selected-focused-border-color-override": "oklch(55% 0.2 250)",
    "--trees-focus-ring-color-override": "oklch(50% 0.15 250)",
  },
  dark: {
    "color-scheme": "dark",
    "--panel-bg": "oklch(20.5% 0 0)",
    "--panel-border": "oklch(37.1% 0 0)",
    "--trees-bg-override": "oklch(20.5% 0 0)",
    "--trees-fg-override": "oklch(98.5% 0 0)",
    "--trees-fg-muted-override": "oklch(75% 0 0)",
    "--trees-bg-muted-override": "oklch(26.9% 0 0)",
    "--trees-search-fg-override": "oklch(85% 0 0)",
    "--trees-search-bg-override": "oklch(20% 0 0)",
    "--trees-border-color-override": "oklch(100% 0 0 / 0.12)",
    "--trees-selected-fg-override": "oklch(97% 0.04 250)",
    "--trees-selected-bg-override": "oklch(35% 0.08 250)",
    "--trees-selected-border-color-override": "oklch(65% 0.2 250)",
    "--trees-selected-focused-border-color-override": "oklch(75% 0.2 250)",
    "--trees-focus-ring-color-override": "oklch(70% 0.15 250)",
  },
  synthwave: {
    "color-scheme": "dark",
    "--panel-bg": "#1e1b2b",
    "--panel-border": "rgb(249 42 173 / 0.4)",
    "--panel-shadow": "inset 0 0 60px rgb(249 42 173 / 0.08)",
    "--trees-bg-override": "transparent",
    "--trees-fg-override": "oklch(91.2% 0.016 294)",
    "--trees-fg-muted-override": "oklch(75.6% 0.04 310)",
    "--trees-bg-muted-override": "oklch(76.9% 0.19 339 / 0.12)",
    "--trees-search-fg-override": "oklch(84.4% 0.04 310)",
    "--trees-search-bg-override": "oklch(27.2% 0.05 302)",
    "--trees-border-color-override": "oklch(76.9% 0.19 339 / 0.35)",
    "--trees-selected-fg-override": "oklch(76.9% 0.19 339)",
    "--trees-selected-bg-override": "oklch(66.3% 0.26 348 / 0.25)",
    "--trees-selected-border-color-override": "oklch(66.3% 0.26 348)",
    "--trees-selected-focused-border-color-override": "oklch(76.9% 0.19 339)",
    "--trees-focus-ring-color-override": "oklch(89.2% 0.14 193)",
  },
} as const satisfies Record<string, Record<string, string>>;

/**
 * Shiki and VS Code themes in the shape `theme.styles` reads. Only the
 * workbench keys the tree looks at are listed; anything absent falls back.
 */
export const themes = {
  dracula: {
    name: "Dracula",
    type: "dark",
    colors: {
      "editor.background": "#282a36",
      "editor.foreground": "#f8f8f2",
      "sideBar.background": "#21222c",
      "sideBar.foreground": "#f8f8f2",
      "sideBar.border": "#191a21",
      "list.activeSelectionBackground": "#44475a",
      "list.activeSelectionForeground": "#f8f8f2",
      "list.hoverBackground": "#44475a75",
      focusBorder: "#6272a4",
      "input.background": "#21222c",
      "gitDecoration.addedResourceForeground": "#50fa7b",
      "gitDecoration.modifiedResourceForeground": "#ffb86c",
      "gitDecoration.deletedResourceForeground": "#ff5555",
    },
  },
  githubLight: {
    name: "GitHub Light",
    type: "light",
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#1f2328",
      "sideBar.background": "#f6f8fa",
      "sideBar.foreground": "#1f2328",
      "sideBar.border": "#d1d9e0",
      "list.activeSelectionBackground": "#ddf4ff",
      "list.activeSelectionForeground": "#0969da",
      "list.hoverBackground": "#eaeef2",
      focusBorder: "#0969da",
      "input.background": "#ffffff",
      "gitDecoration.addedResourceForeground": "#1a7f37",
      "gitDecoration.modifiedResourceForeground": "#9a6700",
      "gitDecoration.deletedResourceForeground": "#cf222e",
    },
  },
} as const satisfies Record<string, Tree.Theme>;

export const asStyle = (palette: Record<string, string>): string =>
  Object.entries(palette)
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");
