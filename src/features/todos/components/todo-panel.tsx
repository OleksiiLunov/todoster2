"use client";

import type { FormEvent } from "react";
import { CreateItemForm } from "@/features/todos/components/create-item-form";
import { TodoItemRow } from "@/features/todos/components/todo-item-row";
import type { TodoListSnapshot } from "@/lib/todos/types";

type TodoPanelProps = {
  itemError: string;
  itemRenameErrors: Record<string, string>;
  itemTitle: string;
  list: TodoListSnapshot | null;
  listRenameError: string;
  maxTitleLength: number;
  onItemSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onItemTitleChange?: (title: string) => void;
  onSetTodoDone?: (itemId: string, isDone: boolean) => void;
  onSetTodoItemTitle?: (itemId: string, title: string) => void;
  onSetTodoListTitle?: (title: string) => void;
  onTodoItemTitleInput?: (itemId: string) => void;
  onTodoListTitleInput?: () => void;
};

export function TodoPanel({
  itemError,
  itemRenameErrors,
  itemTitle,
  list,
  listRenameError,
  maxTitleLength,
  onItemSubmit,
  onItemTitleChange,
  onSetTodoDone,
  onSetTodoItemTitle,
  onSetTodoListTitle,
  onTodoItemTitleInput,
  onTodoListTitleInput,
}: TodoPanelProps) {
  if (
    !list ||
    !onItemSubmit ||
    !onItemTitleChange ||
    !onSetTodoDone ||
    !onSetTodoItemTitle ||
    !onSetTodoListTitle ||
    !onTodoItemTitleInput ||
    !onTodoListTitleInput
  ) {
    return (
      <section className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <h2 className="text-lg font-medium text-zinc-950">No list selected</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Select a list on the left to view its todos.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4">
        <div className="min-w-0 flex-1">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              onSetTodoListTitle(String(formData.get("title") ?? ""));
            }}
          >
            <input
              className="h-10 min-w-0 flex-1 rounded-md border border-zinc-300 px-3 text-base font-semibold text-zinc-950 outline-none transition focus:border-zinc-900"
              defaultValue={list.title}
              key={list.updatedAt}
              maxLength={maxTitleLength}
              name="title"
              onChange={onTodoListTitleInput}
            />
            <button
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              type="submit"
            >
              Rename
            </button>
          </form>
          {listRenameError ? (
            <p className="mt-2 text-sm text-red-600">{listRenameError}</p>
          ) : null}
          <p className="mt-1 text-sm text-zinc-500">
            {list.items.length} todos
          </p>
        </div>
      </div>

      <CreateItemForm
        error={itemError}
        inputId={`new-item-title-${list.id}`}
        maxTitleLength={maxTitleLength}
        onSubmit={onItemSubmit}
        onTitleChange={onItemTitleChange}
        title={itemTitle}
      />

      {list.items.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No todos yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100">
          {list.items.map((item) => (
            <TodoItemRow
              item={item}
              key={item.id}
              maxTitleLength={maxTitleLength}
              onRenameTitleInput={() => onTodoItemTitleInput(item.id)}
              onSetDone={(isDone) => onSetTodoDone(item.id, isDone)}
              onSetTitle={(title) => onSetTodoItemTitle(item.id, title)}
              renameError={itemRenameErrors[item.id] ?? ""}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
