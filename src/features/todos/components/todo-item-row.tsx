"use client";

import type { TodoItemSnapshot } from "@/lib/todos/types";

type TodoItemRowProps = {
  item: TodoItemSnapshot;
  maxTitleLength: number;
  onDelete: () => void;
  onRenameTitleInput: () => void;
  onSetDone: (isDone: boolean) => void;
  onSetTitle: (title: string) => void;
  renameError: string;
};

export function TodoItemRow({
  item,
  maxTitleLength,
  onDelete,
  onRenameTitleInput,
  onSetDone,
  onSetTitle,
  renameError,
}: TodoItemRowProps) {
  return (
    <li className="flex items-start gap-3 py-3">
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
        </div>
        {renameError ? (
          <p className="mt-2 text-sm text-red-600">{renameError}</p>
        ) : null}
      </form>
    </li>
  );
}
