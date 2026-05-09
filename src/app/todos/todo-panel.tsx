"use client";

import type { FormEvent } from "react";
import { CreateItemForm } from "@/app/todos/create-item-form";
import { TodoItemRow } from "@/app/todos/todo-item-row";
import type { TodoListSnapshot } from "@/lib/todos/types";

type TodoPanelProps = {
  itemError: string;
  itemTitle: string;
  list: TodoListSnapshot | null;
  maxTitleLength: number;
  onItemSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onItemTitleChange?: (title: string) => void;
};

export function TodoPanel({
  itemError,
  itemTitle,
  list,
  maxTitleLength,
  onItemSubmit,
  onItemTitleChange,
}: TodoPanelProps) {
  if (!list || !onItemSubmit || !onItemTitleChange) {
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
        <div>
          <h2 className="text-xl font-semibold text-zinc-950">{list.title}</h2>
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
            <TodoItemRow item={item} key={item.id} />
          ))}
        </ul>
      )}
    </section>
  );
}
