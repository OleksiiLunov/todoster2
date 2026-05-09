"use client";

import { type FormEvent, useEffect, useState } from "react";
import { TodoHeader } from "@/app/todos/todo-header";
import { TodoListPanel } from "@/app/todos/todo-list-panel";
import { TodoPanel } from "@/app/todos/todo-panel";
import type { TodoSnapshot } from "@/lib/todos/types";

const TODO_SNAPSHOT_STORAGE_KEY = "todoster:snapshot:v1";
export const MAX_TODO_TITLE_LENGTH = 120;

type TodoBrowserProps = {
  bootstrap: TodoSnapshot;
};

function createBrowserId(prefix: "list" | "item") {
  return `${prefix}_${crypto.randomUUID()}`;
}

function validateTitle(title: string) {
  const trimmedTitle = title.trim();

  if (trimmedTitle.length === 0) {
    return { title: "", error: "Enter a title first." };
  }

  if (trimmedTitle.length > MAX_TODO_TITLE_LENGTH) {
    return {
      title: "",
      error: `Keep titles under ${MAX_TODO_TITLE_LENGTH} characters.`,
    };
  }

  return { title: trimmedTitle, error: "" };
}

export function TodoBrowser({ bootstrap }: TodoBrowserProps) {
  const [snapshot, setSnapshot] = useState<TodoSnapshot>(bootstrap);
  const [listTitle, setListTitle] = useState("");
  const [listError, setListError] = useState("");
  const [itemTitles, setItemTitles] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [listRenameErrors, setListRenameErrors] = useState<
    Record<string, string>
  >({});
  const [itemRenameErrors, setItemRenameErrors] = useState<
    Record<string, string>
  >({});
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(
      TODO_SNAPSHOT_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  }, [snapshot]);

  const totalItems = snapshot.lists.reduce(
    (count, list) => count + list.items.length,
    0,
  );
  const selectedList =
    snapshot.lists.find((list) => list.id === selectedListId) ?? null;

  function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateTitle(listTitle);
    if (validation.error) {
      setListError(validation.error);
      return;
    }

    const now = new Date().toISOString();
    const listId = createBrowserId("list");

    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      lists: [
        ...currentSnapshot.lists,
        {
          id: listId,
          title: validation.title,
          position: currentSnapshot.lists.length,
          createdAt: now,
          updatedAt: now,
          items: [],
        },
      ],
    }));
    setSelectedListId(listId);
    setListTitle("");
    setListError("");
  }

  function handleCreateItem(
    event: FormEvent<HTMLFormElement>,
    listId: string,
  ) {
    event.preventDefault();

    const validation = validateTitle(itemTitles[listId] ?? "");
    if (validation.error) {
      setItemErrors((currentErrors) => ({
        ...currentErrors,
        [listId]: validation.error,
      }));
      return;
    }

    const now = new Date().toISOString();

    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      lists: currentSnapshot.lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              updatedAt: now,
              items: [
                ...list.items,
                {
                  id: createBrowserId("item"),
                  title: validation.title,
                  position: list.items.length,
                  isDone: false,
                  createdAt: now,
                  updatedAt: now,
                },
              ],
            }
          : list,
      ),
    }));
    setItemTitles((currentTitles) => ({ ...currentTitles, [listId]: "" }));
    setItemErrors((currentErrors) => ({ ...currentErrors, [listId]: "" }));
  }

  function setTodoDone(listId: string, itemId: string, isDone: boolean) {
    if (typeof isDone !== "boolean") {
      return;
    }

    setSnapshot((currentSnapshot) => {
      const targetList = currentSnapshot.lists.find(
        (list) => list.id === listId,
      );
      const targetItem = targetList?.items.find((item) => item.id === itemId);

      if (!targetList || !targetItem || targetItem.isDone === isDone) {
        return currentSnapshot;
      }

      const now = new Date().toISOString();

      return {
        ...currentSnapshot,
        lists: currentSnapshot.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                updatedAt: now,
                items: list.items.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        isDone,
                        updatedAt: now,
                      }
                    : item,
                ),
              }
            : list,
        ),
      };
    });
  }

  function setTodoListTitle(listId: string, title: string) {
    const validation = validateTitle(title);
    if (validation.error) {
      setListRenameErrors((currentErrors) => ({
        ...currentErrors,
        [listId]: validation.error,
      }));
      return;
    }

    setSnapshot((currentSnapshot) => {
      const targetList = currentSnapshot.lists.find(
        (list) => list.id === listId,
      );

      if (!targetList || targetList.title === validation.title) {
        return currentSnapshot;
      }

      const now = new Date().toISOString();

      return {
        ...currentSnapshot,
        lists: currentSnapshot.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                title: validation.title,
                updatedAt: now,
              }
            : list,
        ),
      };
    });
    setListRenameErrors((currentErrors) => ({
      ...currentErrors,
      [listId]: "",
    }));
  }

  function setTodoItemTitle(listId: string, itemId: string, title: string) {
    const validation = validateTitle(title);
    if (validation.error) {
      setItemRenameErrors((currentErrors) => ({
        ...currentErrors,
        [itemId]: validation.error,
      }));
      return;
    }

    setSnapshot((currentSnapshot) => {
      const targetList = currentSnapshot.lists.find(
        (list) => list.id === listId,
      );
      const targetItem = targetList?.items.find((item) => item.id === itemId);

      if (!targetList || !targetItem || targetItem.title === validation.title) {
        return currentSnapshot;
      }

      const now = new Date().toISOString();

      return {
        ...currentSnapshot,
        lists: currentSnapshot.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                updatedAt: now,
                items: list.items.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        title: validation.title,
                        updatedAt: now,
                      }
                    : item,
                ),
              }
            : list,
        ),
      };
    });
    setItemRenameErrors((currentErrors) => ({
      ...currentErrors,
      [itemId]: "",
    }));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10">
      <TodoHeader listCount={snapshot.lists.length} todoCount={totalItems} />

      <section className="grid min-h-[28rem] gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <TodoListPanel
          createListError={listError}
          createListTitle={listTitle}
          lists={snapshot.lists}
          maxTitleLength={MAX_TODO_TITLE_LENGTH}
          onCreateListSubmit={handleCreateList}
          onCreateListTitleChange={(title) => {
            setListTitle(title);
            setListError("");
          }}
          onSelectList={setSelectedListId}
          selectedListId={selectedListId}
        />

        <TodoPanel
          itemError={selectedList ? (itemErrors[selectedList.id] ?? "") : ""}
          itemRenameErrors={itemRenameErrors}
          itemTitle={selectedList ? (itemTitles[selectedList.id] ?? "") : ""}
          list={selectedList}
          listRenameError={
            selectedList ? (listRenameErrors[selectedList.id] ?? "") : ""
          }
          maxTitleLength={MAX_TODO_TITLE_LENGTH}
          onItemSubmit={
            selectedList
              ? (event) => handleCreateItem(event, selectedList.id)
              : undefined
          }
          onItemTitleChange={
            selectedList
              ? (title) => {
                  setItemTitles((currentTitles) => ({
                    ...currentTitles,
                    [selectedList.id]: title,
                  }));
                  setItemErrors((currentErrors) => ({
                    ...currentErrors,
                    [selectedList.id]: "",
                  }));
                }
              : undefined
          }
          onSetTodoDone={
            selectedList
              ? (itemId, isDone) => setTodoDone(selectedList.id, itemId, isDone)
              : undefined
          }
          onSetTodoItemTitle={
            selectedList
              ? (itemId, title) =>
                  setTodoItemTitle(selectedList.id, itemId, title)
              : undefined
          }
          onSetTodoListTitle={
            selectedList
              ? (title) => setTodoListTitle(selectedList.id, title)
              : undefined
          }
          onTodoItemTitleInput={
            selectedList
              ? (itemId) =>
                  setItemRenameErrors((currentErrors) => ({
                    ...currentErrors,
                    [itemId]: "",
                  }))
              : undefined
          }
          onTodoListTitleInput={
            selectedList
              ? () =>
                  setListRenameErrors((currentErrors) => ({
                    ...currentErrors,
                    [selectedList.id]: "",
                  }))
              : undefined
          }
        />
      </section>
    </main>
  );
}
