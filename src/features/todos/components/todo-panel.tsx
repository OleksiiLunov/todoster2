"use client";

import type { FormEvent } from "react";
import { CreateItemForm } from "@/features/todos/components/create-item-form";
import { TodoItemRow } from "@/features/todos/components/todo-item-row";
import type { TodoListSnapshot } from "@/lib/todos/types";

export type TodoItemStatusFilter = "active" | "all" | "completed";

type TodoPanelProps = {
  itemError: string;
  itemStatusFilter: TodoItemStatusFilter;
  itemRenameErrors: Record<string, string>;
  itemTitle: string;
  list: TodoListSnapshot | null;
  listRenameError: string;
  maxTitleLength: number;
  onDeleteTodoItem?: (itemId: string) => void;
  onDeleteTodoList?: () => void;
  onItemSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onItemStatusFilterChange: (filter: TodoItemStatusFilter) => void;
  onItemTitleChange?: (title: string) => void;
  onMoveTodoItem?: (itemId: string, direction: "down" | "up") => void;
  onSetTodoDone?: (itemId: string, isDone: boolean) => void;
  onSetTodoItemTitle?: (itemId: string, title: string) => void;
  onSetTodoListTitle?: (title: string) => void;
  onTodoItemTitleInput?: (itemId: string) => void;
  onTodoListTitleInput?: () => void;
};

export function TodoPanel({
  itemError,
  itemStatusFilter,
  itemRenameErrors,
  itemTitle,
  list,
  listRenameError,
  maxTitleLength,
  onDeleteTodoItem,
  onDeleteTodoList,
  onItemSubmit,
  onItemStatusFilterChange,
  onItemTitleChange,
  onMoveTodoItem,
  onSetTodoDone,
  onSetTodoItemTitle,
  onSetTodoListTitle,
  onTodoItemTitleInput,
  onTodoListTitleInput,
}: TodoPanelProps) {
  if (
    !list ||
    !onDeleteTodoItem ||
    !onDeleteTodoList ||
    !onItemSubmit ||
    !onItemStatusFilterChange ||
    !onItemTitleChange ||
    !onMoveTodoItem ||
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

  const visibleItems = list.items.filter((item) => {
    if (itemStatusFilter === "active") {
      return !item.isDone;
    }

    if (itemStatusFilter === "completed") {
      return item.isDone;
    }

    return true;
  });

  const filters: Array<{ label: string; value: TodoItemStatusFilter }> = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
  ];
  const reorderIsDisabled = itemStatusFilter !== "all";

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
            <button
              className="h-10 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 transition hover:bg-red-50"
              onClick={onDeleteTodoList}
              type="button"
            >
              Delete list
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

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isSelected = filter.value === itemStatusFilter;

          return (
            <button
              aria-pressed={isSelected}
              className={`h-9 rounded-md border px-3 text-sm font-medium transition ${
                isSelected
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              }`}
              key={filter.value}
              onClick={() => onItemStatusFilterChange(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {list.items.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No todos yet.</p>
      ) : visibleItems.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No matching todos.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100">
          {visibleItems.map((item) => {
            const itemIndex = list.items.findIndex(
              (listItem) => listItem.id === item.id,
            );

            return (
              <TodoItemRow
                item={item}
                key={item.id}
                maxTitleLength={maxTitleLength}
                moveDownDisabled={
                  reorderIsDisabled || itemIndex === list.items.length - 1
                }
                moveUpDisabled={reorderIsDisabled || itemIndex === 0}
                onDelete={() => onDeleteTodoItem(item.id)}
                onMoveDown={() => onMoveTodoItem(item.id, "down")}
                onMoveUp={() => onMoveTodoItem(item.id, "up")}
                onRenameTitleInput={() => onTodoItemTitleInput(item.id)}
                onSetDone={(isDone) => onSetTodoDone(item.id, isDone)}
                onSetTitle={(title) => onSetTodoItemTitle(item.id, title)}
                renameError={itemRenameErrors[item.id] ?? ""}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
