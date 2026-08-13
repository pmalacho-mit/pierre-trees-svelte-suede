import {
  FILE_TREE_DEFAULT_ITEM_HEIGHT,
  FILE_TREE_DENSITY_PRESETS,
  createFileTreeIconResolver,
  getBuiltInSpriteSheet,
  prepareFileTreeInput,
  preparePresortedFileTreeInput,
  themeToTreeStyles,
  type FileTreeBatchOperation,
  type FileTreeCompositionOptions,
  type FileTreeDensity,
  type FileTreeDirectoryHandle,
  type FileTreeDragAndDropConfig,
  type FileTreeDropContext,
  type FileTreeDropResult,
  type FileTreeFileHandle,
  type FileTreeGitStatusPatch,
  type FileTreeIconConfig,
  type FileTreeIcons,
  type FileTreeItemHandle,
  type FileTreeMutationEvent,
  type FileTreePreparedInput,
  type FileTreeRenamingConfig,
  type FileTreeRowDecorationRenderer,
  type FileTreeSearchMode,
  type FileTreeSortComparator,
  type FileTreeVisibleRow,
  type GitStatus,
  type GitStatusEntry,
  type TreeThemeInput,
} from "@pierre/trees";
import TreeComponent from "./Tree.svelte";
import { Model as TreeModel } from "./model.svelte";
import type { Props as TreeProps } from "./Tree.svelte";
import type { Path as TreePath } from "./model.svelte";
import type { ContextMenuTrigger } from "./composition";
import type {
  Events as TreeEvents,
  Handlers as TreeHandlers,
  Unsubscribe as TreeUnsubscribe,
} from "./events";
import type { Options as TreeOptions } from "./options";

export const Tree = {
  Model: TreeModel,
  Component: TreeComponent,
};

export namespace Tree {
  export type Model = TreeModel;
  export type Props = TreeProps;
  export type Options = TreeOptions;
  export type Path = TreePath;
  export type Events = TreeEvents;
  export type Handlers = TreeHandlers;
  export type Unsubscribe = TreeUnsubscribe;

  export type Item = FileTreeItemHandle;
  export type Directory = FileTreeDirectoryHandle;
  export type File = FileTreeFileHandle;
  export type Row = FileTreeVisibleRow;

  export type Mutation = FileTreeMutationEvent;
  export type BatchOperation = FileTreeBatchOperation;
  export type Composition = FileTreeCompositionOptions;
  export type ContextMenu = ContextMenuTrigger;
  export type Decoration = FileTreeRowDecorationRenderer;
  export type Density = FileTreeDensity;
  export type DragAndDrop = FileTreeDragAndDropConfig;
  export type Drop = FileTreeDropResult;
  export type DropContext = FileTreeDropContext;
  export type GitState = GitStatus;
  export type GitEntry = GitStatusEntry;
  export type GitPatch = FileTreeGitStatusPatch;
  export type Icons = FileTreeIcons;
  export type IconConfig = FileTreeIconConfig;
  export type PreparedInput = FileTreePreparedInput;
  export type Renaming = FileTreeRenamingConfig;
  export type SearchMode = FileTreeSearchMode;
  export type Sort = FileTreeSortComparator;
  export type Theme = TreeThemeInput;
}

export const input = {
  prepare: prepareFileTreeInput,
  presorted: preparePresortedFileTreeInput,
};

/** `themeToTreeStyles` speaks React's camelCase style keys; CSS text needs kebab-case. */
const cssProperty = (key: string): string =>
  key.startsWith("--")
    ? key
    : key.replace(/[A-Z]/g, (upper) => `-${upper.toLowerCase()}`);

export const theme = {
  styles: themeToTreeStyles,
  css: (source: TreeThemeInput): string =>
    Object.entries(themeToTreeStyles(source))
      .filter(([, value]) => value !== "")
      .map(([property, value]) => `${cssProperty(property)}: ${value}`)
      .join("; "),
};

export const icons = {
  spriteSheet: getBuiltInSpriteSheet,
  resolver: createFileTreeIconResolver,
};

export const density = {
  presets: FILE_TREE_DENSITY_PRESETS,
  defaultItemHeight: FILE_TREE_DEFAULT_ITEM_HEIGHT,
};
