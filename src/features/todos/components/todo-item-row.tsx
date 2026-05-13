"use client";

import type { DragEvent } from "react";
import type { TodoItemSnapshot } from "@/lib/todos/types";

type TodoItemRowProps = {
  item: TodoItemSnapshot;
  maxTitleLength: number;
  moveDownDisabled: boolean;
  moveUpDisabled: boolean;
  onDelete: () => void;
  onDragEnd: () => void;
  onDragLeave: () => void;
  onDragOver: (event: DragEvent<HTMLLIElement>) => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLLIElement>) => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRenameTitleInput: () => void;
  onSetDone: (isDone: boolean) => void;
  onSetTitle: (title: string) => void;
  renameError: string;
  reorderDisabled: boolean;
  showDragOver: boolean;
  showDragging: boolean;
};

export function TodoItemRow({
  item,
  maxTitleLength,
  moveDownDisabled,
  moveUpDisabled,
  onDelete,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  onMoveDown,
  onMoveUp,
  onRenameTitleInput,
  onSetDone,
  onSetTitle,
  renameError,
  reorderDisabled,
  showDragOver,
  showDragging,
}: TodoItemRowProps) {
  return (
    <li
      className={`flex items-start gap-3 rounded-md py-3 transition ${
        showDragOver ? "bg-zinc-100 ring-2 ring-zinc-300" : ""
      } ${showDragging ? "opacity-60" : ""}`}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <button
        aria-disabled={reorderDisabled}
        aria-label={`Drag ${item.title}`}
        className={`mt-0.5 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border border-zinc-300 text-sm font-semibold text-zinc-500 ${
          reorderDisabled
            ? "cursor-not-allowed opacity-40"
            : "cursor-grab active:cursor-grabbing"
        }`}
        draggable={!reorderDisabled}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        tabIndex={reorderDisabled ? -1 : 0}
        title={
          reorderDisabled
            ? "Switch to All to reorder"
            : "Drag to reorder within this list"
        }
        type="button"
      >
        ::
      </button>
      <input
        aria-label={`Mark ${item.title} as ${item.isDone ? "not done" : "done"}`}
        checked={item.isDone}
        className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-950"
        onChange={(event) => onSetDone(event.target.checked)}
        type="checkbox"
      />
      <form
        className="min-w-0 flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onSetTitle(String(formData.get("title") ?? ""));
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={`h-9 min-w-0 flex-1 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-900 ${
              item.isDone ? "text-zinc-500 line-through" : "text-zinc-800"
            }`}
            defaultValue={item.title}
            key={item.updatedAt}
            maxLength={maxTitleLength}
            name="title"
            onChange={onRenameTitleInput}
          />
          <button
            className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            type="submit"
          >
            Rename
          </button>
          <button
            className="h-9 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 transition hover:bg-red-50"
            onClick={onDelete}
            type="button"
          >
            Delete
          </button>
          <button
            className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={moveUpDisabled}
            onClick={onMoveUp}
            type="button"
          >
            Up
          </button>
          <button
            className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={moveDownDisabled}
            onClick={onMoveDown}
            type="button"
          >
            Down
          </button>
        </div>
        {renameError ? (
          <p className="mt-2 text-sm text-red-600">{renameError}</p>
        ) : null}
      </form>
    </li>
  );
}
