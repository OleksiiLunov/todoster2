import type { FormEvent } from "react";
import { CreateListForm } from "@/app/todos/create-list-form";
import type { TodoListSnapshot } from "@/lib/todos/types";

type TodoListPanelProps = {
  createListError: string;
  createListTitle: string;
  lists: TodoListSnapshot[];
  maxTitleLength: number;
  onCreateListSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCreateListTitleChange: (title: string) => void;
  onSelectList: (listId: string) => void;
  selectedListId: string | null;
};

export function TodoListPanel({
  createListError,
  createListTitle,
  lists,
  maxTitleLength,
  onCreateListSubmit,
  onCreateListTitleChange,
  onSelectList,
  selectedListId,
}: TodoListPanelProps) {
  return (
    <aside className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <CreateListForm
        error={createListError}
        maxTitleLength={maxTitleLength}
        onSubmit={onCreateListSubmit}
        onTitleChange={onCreateListTitleChange}
        title={createListTitle}
      />

      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Lists
        </h2>
        <span className="text-sm font-medium text-zinc-500">
          {lists.length}
        </span>
      </div>

      {lists.length === 0 ? (
        <div className="py-10 text-center">
          <h3 className="text-base font-medium text-zinc-950">
            No todo lists
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Create a list locally to start shaping this browser snapshot.
          </p>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {lists.map((list) => {
            const isSelected = list.id === selectedListId;

            return (
              <li key={list.id}>
                <button
                  aria-current={isSelected ? "true" : undefined}
                  className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-3 text-left transition ${
                    isSelected
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-transparent text-zinc-800 hover:border-zinc-200 hover:bg-zinc-50"
                  }`}
                  onClick={() => onSelectList(list.id)}
                  type="button"
                >
                  <span className="min-w-0 truncate text-sm font-medium">
                    {list.title}
                  </span>
                  <span
                    className={`shrink-0 text-xs ${
                      isSelected ? "text-zinc-200" : "text-zinc-500"
                    }`}
                  >
                    {list.items.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
