import type { Tree } from "$release";

type Wait = (amount: { frames: number }) => Promise<void>;

const shadowOf = (model: Tree.Model): ShadowRoot => {
  const container = model.tree.getFileTreeContainer();
  if (!container?.shadowRoot) throw new Error("the tree is not mounted yet");
  return container.shadowRoot;
};

const elements = (model: Tree.Model, selector: string): HTMLElement[] => [
  ...shadowOf(model).querySelectorAll<HTMLElement>(selector),
];

const pathOf = (row: HTMLElement): string => row.dataset.itemPath ?? "";

/** What the tree actually put on the page, read back out of its shadow root. */
export const rendered = {
  rows: (model: Tree.Model): HTMLElement[] =>
    elements(model, '[data-type="item"]:not([data-file-tree-sticky-row])'),

  paths: (model: Tree.Model): string[] => rendered.rows(model).map(pathOf),

  row: (model: Tree.Model, path: string): HTMLElement | null =>
    shadowOf(model).querySelector<HTMLElement>(
      `[data-type="item"][data-item-path="${path}"]`,
    ),

  selected: (model: Tree.Model): string[] =>
    elements(model, "[data-item-selected]").map(pathOf),

  gitStatuses: (model: Tree.Model): Record<string, string> =>
    Object.fromEntries(
      elements(model, "[data-item-git-status]").map((row) => [
        pathOf(row),
        row.dataset.itemGitStatus ?? "",
      ]),
    ),

  searchInput: (model: Tree.Model): HTMLInputElement | null =>
    shadowOf(model).querySelector("[data-file-tree-search-input]"),

  renameInput: (model: Tree.Model): HTMLInputElement | null =>
    shadowOf(model).querySelector("[data-item-rename-input]"),

  headerSlot: (model: Tree.Model): Element[] =>
    shadowOf(model)
      .querySelector<HTMLSlotElement>('slot[name="header"]')
      ?.assignedElements() ?? [],

  contextMenuSlot: (model: Tree.Model): Element[] =>
    shadowOf(model)
      .querySelector<HTMLSlotElement>('slot[name="context-menu"]')
      ?.assignedElements() ?? [],

  /** The menu itself, past whatever wrappers Svelte put in between. */
  contextMenu: (model: Tree.Model): HTMLElement | null =>
    rendered.contextMenuSlot(model)[0]?.querySelector('[role="menu"]') ?? null,

  styleText: (model: Tree.Model): string =>
    [...shadowOf(model).querySelectorAll("style")]
      .map((style) => style.textContent ?? "")
      .join("\n"),
};

/** Polls a frame at a time so a test reads as "when this is true" rather than "after n ms". */
export const once = async (
  wait: Wait,
  ready: () => boolean,
  frames = 180,
): Promise<void> => {
  for (let frame = 0; frame < frames; frame++) {
    if (ready()) return;
    await wait({ frames: 1 });
  }
  throw new Error(`condition was still false after ${frames} frames`);
};

export const mounted = (wait: Wait, model: Tree.Model): Promise<void> =>
  once(wait, () => model.tree.getFileTreeContainer()?.shadowRoot != null);

/**
 * The tree lives in a shadow root, where `@storybook/test`'s `userEvent` cannot
 * focus an element, so its own listeners are driven with real events instead.
 *
 * A right-click menu is anchored to the pointer, so the event has to carry
 * where it happened; without coordinates the menu lands at the viewport origin.
 */
export const rightClick = (element: HTMLElement): { x: number; y: number } => {
  const { left, top, width, height } = element.getBoundingClientRect();
  const at = { x: Math.round(left + width / 2), y: Math.round(top + height / 2) };
  element.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      composed: true,
      clientX: at.x,
      clientY: at.y,
    }),
  );
  return at;
};

/** The three events a browser sends for one double click, in that order. */
export const doubleClick = (element: HTMLElement): void => {
  const { left, top, width, height } = element.getBoundingClientRect();
  const at = { x: Math.round(left + width / 2), y: Math.round(top + height / 2) };
  const beats = [
    ["click", 1],
    ["click", 2],
    ["dblclick", 2],
  ] as const;
  for (const [type, detail] of beats)
    element.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        composed: true,
        detail,
        clientX: at.x,
        clientY: at.y,
      }),
    );
};

/**
 * The single floating trigger button follows whichever row is hovered, and the
 * tree exposes that hover as a debug event so a test does not have to move a
 * real pointer through a shadow root.
 */
export const hoverRow = (model: Tree.Model, path: string): void => {
  shadowOf(model)
    .querySelector("[data-file-tree-virtualized-root]")
    ?.dispatchEvent(
      new CustomEvent("file-tree-debug-set-context-menu-trigger", {
        detail: { path },
      }),
    );
};

export const contextMenuTrigger = (model: Tree.Model): HTMLElement | null =>
  shadowOf(model).querySelector('button[data-type="context-menu-trigger"]');

export const typeInto = (input: HTMLInputElement, value: string): void => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
};

const painted = (color: string, within: HTMLElement): string => {
  const probe = document.createElement("span");
  probe.style.color = color;
  within.append(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  return computed;
};

/** `getComputedStyle` answers in `rgb()`, so an expectation has to speak it too. */
export const asRgb = (color: string): string => painted(color, document.body);

/**
 * A custom property computes to an unresolved token stream, so reading one off
 * an element says nothing about the colour it paints. Evaluating `var()` where
 * the element lives is what resolves the `-override` → theme → default chain.
 */
export const resolvedColor = (within: HTMLElement, variable: string): string =>
  painted(`var(${variable})`, within);

export const pressKey = (element: HTMLElement, key: string): void => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, composed: true }),
  );
};
