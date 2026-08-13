import type { Tree } from "$release";

const placeholder = { file: "untitled", folder: "untitled/" } as const;

const parentOf = (path: string): string => {
  const trimmed = path.endsWith("/") ? path.slice(0, -1) : path;
  const lastSlash = trimmed.lastIndexOf("/");
  return lastSlash < 0 ? "" : trimmed.slice(0, lastSlash + 1);
};

/** Both spellings of a path collide, so a directory can never shadow a file. */
const taken = (model: Tree.Model, path: string): boolean => {
  const alternate = path.endsWith("/") ? path.slice(0, -1) : `${path}/`;
  return model.item(path) !== null || model.item(alternate) !== null;
};

const numbered = (path: string, suffix: number): string => {
  if (path.endsWith("/")) return `${path.slice(0, -1)}-${suffix}/`;
  const dot = path.lastIndexOf(".");
  return dot > path.lastIndexOf("/")
    ? `${path.slice(0, dot)}-${suffix}${path.slice(dot)}`
    : `${path}-${suffix}`;
};

const vacant = (model: Tree.Model, path: string): string => {
  let suffix = 0;
  let candidate = path;
  while (taken(model, candidate)) candidate = numbered(path, ++suffix);
  return candidate;
};

/**
 * The four things the trees.software context menu can do. New entries land
 * inside a directory and beside a file, and open straight into rename mode so
 * the placeholder name is never what the user is left with.
 */
export const entries = {
  add(model: Tree.Model, item: Tree.ContextMenu["item"], kind: "file" | "folder") {
    const directory = item.kind === "directory" ? item.path : parentOf(item.path);
    const path = vacant(model, `${directory}${placeholder[kind]}`);
    model.add(path);
    model.rename(path, { removeIfCanceled: true });
  },

  rename(model: Tree.Model, item: Tree.ContextMenu["item"]) {
    model.rename(item.path);
  },

  remove(model: Tree.Model, item: Tree.ContextMenu["item"]) {
    model.remove(item.path, { recursive: item.kind === "directory" });
  },
};
