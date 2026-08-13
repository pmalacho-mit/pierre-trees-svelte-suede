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
 */
export const rightClick = (element: HTMLElement): void => {
  element.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, composed: true }),
  );
};

export const typeInto = (input: HTMLInputElement, value: string): void => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
};

export const pressKey = (element: HTMLElement, key: string): void => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, composed: true }),
  );
};
