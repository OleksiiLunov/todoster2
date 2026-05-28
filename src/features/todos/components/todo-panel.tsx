"use client";

import { useState, type DragEvent, type FormEvent, type SubmitEvent } from "react";
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
  onReorderTodoItem?: (itemId: string, targetItemId: string) => void;
  onSetTodoDone?: (itemId: string, isDone: boolean) => void;
  onSetTodoItemTitle?: (itemId: string, title: string) => void;
  onSetTodoListTitle?: (title: string) => void;
  onTodoItemTitleInput?: (itemId: string) => void;
  onTodoListTitleInput?: () => void;
  onUncheckAllItems?: () => void;
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
  onReorderTodoItem,
  onSetTodoDone,
  onSetTodoItemTitle,
  onSetTodoListTitle,
  onTodoItemTitleInput,
  onTodoListTitleInput,
  onUncheckAllItems,
}: TodoPanelProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [listNameEditing, setListNameEditing] = useState<boolean>(false);

  function handleListNameEditingSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();             
    if (listNameEditing) {
       const formData = new FormData(event.currentTarget);
       setTodoListTitle(String(formData.get("title") ?? ""));   
    }
    setListNameEditing(!listNameEditing);
  }

  if (
    !list ||
    !onDeleteTodoItem ||
    !onDeleteTodoList ||
    !onItemSubmit ||
    !onItemStatusFilterChange ||
    !onItemTitleChange ||
    !onReorderTodoItem ||
    !onSetTodoDone ||
    !onSetTodoItemTitle ||
    !onSetTodoListTitle ||
    !onTodoItemTitleInput ||
    !onTodoListTitleInput ||
    !onUncheckAllItems
  ) {
    return (
      <section className="rounded-md border border-dashed border-[#d7c8b3] bg-[#fffdf7] p-8 text-center shadow-sm shadow-[#7c4a24]/5">
        <h2 className="text-lg font-medium text-[#173f2a]">No list selected</h2>
        <p className="mt-2 text-sm text-[#6f604d]">
          Select a list on the left to view its todos.
        </p>
      </section>
    );
  }

  const activeList = list;
  const deleteTodoItem = onDeleteTodoItem;
  const deleteTodoList = onDeleteTodoList;
  const itemSubmit = onItemSubmit;
  const itemTitleChange = onItemTitleChange;
  const reorderTodoItem = onReorderTodoItem;
  const setTodoDone = onSetTodoDone;
  const setTodoItemTitle = onSetTodoItemTitle;
  const setTodoListTitle = onSetTodoListTitle;
  const todoItemTitleInput = onTodoItemTitleInput;
  const todoListTitleInput = onTodoListTitleInput;
  const uncheckAllItems = onUncheckAllItems;

  const visibleItems = activeList.items.filter((item) => {
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
  const completedItemCount = activeList.items.filter(
    (item) => item.isDone,
  ).length;

  function handleItemDragStart(
    event: DragEvent<HTMLElement>,
    itemId: string,
  ) {
    if (reorderIsDisabled) {
      event.preventDefault();
      return;
    }

    setDraggedItemId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-todoster-item-id", itemId);
    event.dataTransfer.setData("application/x-todoster-list-id", activeList.id);
  }

  function handleItemDragOver(
    event: DragEvent<HTMLElement>,
    targetItemId: string,
  ) {
    if (reorderIsDisabled) {
      return;
    }

    const itemId =
      draggedItemId ||
      event.dataTransfer.getData("application/x-todoster-item-id");
    const sourceListId =
      event.dataTransfer.getData("application/x-todoster-list-id") ||
      (draggedItemId ? activeList.id : "");

    if (!itemId || itemId === targetItemId || sourceListId !== activeList.id) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverItemId(targetItemId);
  }

  function handleItemDrop(
    event: DragEvent<HTMLElement>,
    targetItemId: string,
  ) {
    event.preventDefault();

    const itemId =
      draggedItemId ||
      event.dataTransfer.getData("application/x-todoster-item-id");
    const sourceListId =
      event.dataTransfer.getData("application/x-todoster-list-id") ||
      (draggedItemId ? activeList.id : "");

    setDraggedItemId(null);
    setDragOverItemId(null);

    if (
      reorderIsDisabled ||
      !itemId ||
      itemId === targetItemId ||
      sourceListId !== activeList.id
    ) {
      return;
    }

    reorderTodoItem(itemId, targetItemId);
  }

  function clearItemDragState() {
    setDraggedItemId(null);
    setDragOverItemId(null);
  }

  return (
    <section className="rounded-md border border-[#e6dccb] bg-[#fffdf7] p-5 shadow-sm shadow-[#7c4a24]/5">
      <div className="flex items-start justify-between gap-4 border-b border-[#efe5d2] pb-4">
        <div className="min-w-0 flex-1">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => handleListNameEditingSubmit(event)}
          >
            <input
              className="h-10 min-w-0 flex-1 rounded-md border border-[#d7c8b3] bg-white px-3 text-base font-semibold text-[#173f2a] outline-none transition focus:border-[#173f2a]"
              defaultValue={activeList.title}
              key={activeList.updatedAt}
              maxLength={maxTitleLength}
              name="title"
              onChange={todoListTitleInput}
              hidden={!listNameEditing}
            />
            <p
              className="pt-2 h-10 min-w-0 flex-1 rounded-md border border-[#d7c8b3] bg-white px-3 text-base font-semibold text-[#173f2a] outline-none transition focus:border-[#173f2a]"
              hidden={listNameEditing}
            >
              {activeList.title}
            </p>
            <button
              className="h-10 rounded-md border border-[#d7c8b3] bg-white px-3 text-sm font-medium text-[#4d3a22] transition hover:bg-[#f7efd9]"
              type="submit"
            >
              {listNameEditing ? "Save" : "Rename"}
            </button>
            <button
              className="h-10 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 transition hover:bg-red-50"
              onClick={deleteTodoList}
              type="button"
            >
              Delete list
            </button>
          </form>
          {listRenameError ? (
            <p className="mt-2 text-sm text-red-600">{listRenameError}</p>
          ) : null}
          <p className="mt-1 text-sm text-[#7b694f]">
            {activeList.items.length} todos
          </p>
        </div>
      </div>

      <CreateItemForm
        error={itemError}
        inputId={`new-item-title-${activeList.id}`}
        maxTitleLength={maxTitleLength}
        onSubmit={itemSubmit}
        onTitleChange={itemTitleChange}
        title={itemTitle}
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isSelected = filter.value === itemStatusFilter;

            return (
              <button
                aria-pressed={isSelected}
                className={`h-9 rounded-md border px-3 text-sm font-medium transition ${isSelected
                    ? "border-[#173f2a] bg-[#173f2a] text-white"
                    : "border-[#d7c8b3] bg-white text-[#4d3a22] hover:bg-[#f7efd9]"
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

        {completedItemCount > 0 ? (
          <div className="flex justify-end">
            <button
              className="h-9 rounded-md border border-[#d7c8b3] bg-white px-3 text-sm font-medium text-[#4d3a22] transition hover:bg-[#f7efd9]"
              onClick={uncheckAllItems}
              type="button"
            >
              Uncheck all
            </button>
          </div>
        ) : null}
      </div>

      {activeList.items.length === 0 ? (
        <p className="mt-6 text-sm text-[#7b694f]">No todos yet.</p>
      ) : visibleItems.length === 0 ? (
        <p className="mt-6 text-sm text-[#7b694f]">No matching todos.</p>
      ) : (
        <ul className="mt-6 divide-y divide-[#efe5d2]">
          {visibleItems.map((item) => (
            <TodoItemRow
              item={item}
              key={item.id}
              maxTitleLength={maxTitleLength}
              onDelete={() => deleteTodoItem(item.id)}
              onDragEnd={clearItemDragState}
              onDragLeave={() => {
                if (dragOverItemId === item.id) {
                  setDragOverItemId(null);
                }
              }}
              onDragOver={(event) => handleItemDragOver(event, item.id)}
              onDragStart={(event) => handleItemDragStart(event, item.id)}
              onDrop={(event) => handleItemDrop(event, item.id)}
              onRenameTitleInput={() => todoItemTitleInput(item.id)}
              onSetDone={(isDone) => setTodoDone(item.id, isDone)}
              onSetTitle={(title) => setTodoItemTitle(item.id, title)}
              renameError={itemRenameErrors[item.id] ?? ""}
              reorderDisabled={reorderIsDisabled}
              showDragOver={dragOverItemId === item.id}
              showDragging={draggedItemId === item.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
