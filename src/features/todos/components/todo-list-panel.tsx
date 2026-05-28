"use client";

import { useState, type DragEvent, type FormEvent } from "react";
import { CreateListForm } from "@/features/todos/components/create-list-form";
import type { TodoListSnapshot } from "@/lib/todos/types";

type TodoListPanelProps = {
  createListError: string;
  createListTitle: string;
  lists: TodoListSnapshot[];
  maxTitleLength: number;
  onCreateListSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCreateListTitleChange: (title: string) => void;
  onReorderTodoList: (listId: string, targetListId: string) => void;
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
  onReorderTodoList,
  onSelectList,
  selectedListId,
}: TodoListPanelProps) {
  const [draggedListId, setDraggedListId] = useState<string | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);

  function handleDragStart(
    event: DragEvent<HTMLElement>,
    listId: string,
  ) {
    setDraggedListId(listId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-todoster-list-id", listId);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, targetListId: string) {
    const listId =
      draggedListId ||
      event.dataTransfer.getData("application/x-todoster-list-id");

    if (!listId || listId === targetListId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverListId(targetListId);
  }

  function handleDrop(event: DragEvent<HTMLElement>, targetListId: string) {
    event.preventDefault();

    const listId =
      draggedListId ||
      event.dataTransfer.getData("application/x-todoster-list-id");

    setDraggedListId(null);
    setDragOverListId(null);

    if (!listId || listId === targetListId) {
      return;
    }

    onReorderTodoList(listId, targetListId);
  }

  function clearDragState() {
    setDraggedListId(null);
    setDragOverListId(null);
  }

  return (
    <aside className="rounded-md border border-[#e6dccb] bg-[#fffdf7] p-4 shadow-sm shadow-[#7c4a24]/5">
      <CreateListForm
        error={createListError}
        maxTitleLength={maxTitleLength}
        onSubmit={onCreateListSubmit}
        onTitleChange={onCreateListTitleChange}
        title={createListTitle}
      />

      <div className="flex items-center justify-between gap-3 border-b border-[#efe5d2] pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7b694f]">
          Lists
        </h2>
        <span className="text-sm font-medium text-[#7b694f]">
          {lists.length}
        </span>
      </div>

      {lists.length === 0 ? (
        <div className="py-10 text-center">
          <h3 className="text-base font-medium text-[#173f2a]">
            No todo lists
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#6f604d]">
            Create a list locally to start shaping this browser snapshot.
          </p>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {lists.map((list) => {
            const isSelected = list.id === selectedListId;

            return (
              <li
                className={`flex gap-2 rounded-md transition ${
                  dragOverListId === list.id
                    ? "bg-[#f7efd9] ring-2 ring-[#c7d39a]"
                    : ""
                } ${draggedListId === list.id ? "opacity-60" : ""}`}
                key={list.id}
                onDragLeave={() => {
                  if (dragOverListId === list.id) {
                    setDragOverListId(null);
                  }
                }}
                onDragOver={(event) => handleDragOver(event, list.id)}
                onDrop={(event) => handleDrop(event, list.id)}
              >
                <button
                  aria-label={`Drag ${list.title}`}
                  className="flex w-8 cursor-grab select-none items-center justify-center rounded-md border border-[#d7c8b3] text-sm font-semibold text-[#7b694f] active:cursor-grabbing"
                  draggable
                  onDragEnd={clearDragState}
                  onDragStart={(event) => handleDragStart(event, list.id)}
                  title="Drag to reorder"
                  type="button"
                >
                  ::
                </button>
                <button
                  aria-current={isSelected ? "true" : undefined}
                  className={`flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md border px-3 py-3 text-left transition ${
                    isSelected
                      ? "border-[#173f2a] bg-[#173f2a] text-white"
                      : "border-transparent text-[#4d3a22] hover:border-[#e6dccb] hover:bg-[#f7efd9]"
                  }`}
                  onClick={() => onSelectList(list.id)}
                  type="button"
                >
                  <span className="min-w-0 truncate text-sm font-medium">
                    {list.title}
                  </span>
                  <span
                    className={`shrink-0 text-xs ${
                      isSelected ? "text-[#e9f0c6]" : "text-[#7b694f]"
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
