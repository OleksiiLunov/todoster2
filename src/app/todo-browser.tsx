"use client";

import { type FormEvent, useEffect, useState } from "react";
import { TodoHeader } from "@/app/todos/todo-header";
import { TodoListPanel } from "@/app/todos/todo-list-panel";
import { TodoPanel } from "@/app/todos/todo-panel";
import type { TodoSnapshot } from "@/lib/todos/types";

const TODO_SNAPSHOT_STORAGE_KEY = "todoster:snapshot:v1";
const TODO_SESSION_MARKER_STORAGE_KEY = "todoster:browser-session:v1";
const TODO_SESSION_TTL_MS = 30 * 60 * 1000;
const TODO_SESSION_HEARTBEAT_MS = 30 * 1000;
export const MAX_TODO_TITLE_LENGTH = 120;

type TodoBrowserProps = {
  bootstrap: TodoSnapshot;
};

type BrowserSessionMarker = {
  startedAt: number;
  lastSeenAt: number;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTodoSnapshot(value: unknown): value is TodoSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.userId !== "string" ||
    typeof value.bootstrappedAt !== "string" ||
    !Array.isArray(value.lists)
  ) {
    return false;
  }

  return value.lists.every((list) => {
    if (!isRecord(list) || !Array.isArray(list.items)) {
      return false;
    }

    const hasValidListShape =
      typeof list.id === "string" &&
      typeof list.title === "string" &&
      typeof list.position === "number" &&
      typeof list.createdAt === "string" &&
      typeof list.updatedAt === "string";

    return (
      hasValidListShape &&
      list.items.every(
        (item) =>
          isRecord(item) &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.position === "number" &&
          typeof item.isDone === "boolean" &&
          typeof item.createdAt === "string" &&
          typeof item.updatedAt === "string",
      )
    );
  });
}

function readStoredTodoSnapshot() {
  const rawSnapshot = window.localStorage.getItem(TODO_SNAPSHOT_STORAGE_KEY);

  if (!rawSnapshot) {
    return null;
  }

  try {
    const parsedSnapshot: unknown = JSON.parse(rawSnapshot);
    return isTodoSnapshot(parsedSnapshot) ? parsedSnapshot : null;
  } catch {
    return null;
  }
}

function isBrowserSessionMarker(value: unknown): value is BrowserSessionMarker {
  return (
    isRecord(value) &&
    typeof value.startedAt === "number" &&
    typeof value.lastSeenAt === "number" &&
    Number.isFinite(value.startedAt) &&
    Number.isFinite(value.lastSeenAt) &&
    value.startedAt > 0 &&
    value.lastSeenAt >= value.startedAt
  );
}

function readStoredBrowserSessionMarker() {
  const rawMarker = window.localStorage.getItem(TODO_SESSION_MARKER_STORAGE_KEY);

  if (!rawMarker) {
    return null;
  }

  try {
    const parsedMarker: unknown = JSON.parse(rawMarker);
    return isBrowserSessionMarker(parsedMarker) ? parsedMarker : null;
  } catch {
    return null;
  }
}

function isBrowserSessionActive(
  marker: BrowserSessionMarker | null,
  now: number,
) {
  return Boolean(marker && now - marker.lastSeenAt <= TODO_SESSION_TTL_MS);
}

function writeBrowserSessionMarker(marker: BrowserSessionMarker) {
  window.localStorage.setItem(
    TODO_SESSION_MARKER_STORAGE_KEY,
    JSON.stringify(marker),
  );
}

function touchBrowserSessionMarker() {
  const now = Date.now();
  const marker = readStoredBrowserSessionMarker();
  const markerIsActive = isBrowserSessionActive(marker, now);

  writeBrowserSessionMarker({
    startedAt: markerIsActive && marker ? marker.startedAt : now,
    lastSeenAt: now,
  });
}

export function TodoBrowser({ bootstrap }: TodoBrowserProps) {
  const [snapshot, setSnapshot] = useState<TodoSnapshot>(bootstrap);
  const [isInitialized, setIsInitialized] = useState(false);
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
    const now = Date.now();
    const sessionMarker = readStoredBrowserSessionMarker();
    const sessionIsActive = isBrowserSessionActive(sessionMarker, now);
    const storedSnapshot = sessionIsActive ? readStoredTodoSnapshot() : null;
    const initialSnapshot = storedSnapshot ?? bootstrap;

    setSnapshot(initialSnapshot);
    window.localStorage.setItem(
      TODO_SNAPSHOT_STORAGE_KEY,
      JSON.stringify(initialSnapshot),
    );
    writeBrowserSessionMarker({
      startedAt: sessionIsActive && sessionMarker ? sessionMarker.startedAt : now,
      lastSeenAt: now,
    });
    setIsInitialized(true);
  }, [bootstrap]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    touchBrowserSessionMarker();

    const intervalId = window.setInterval(
      touchBrowserSessionMarker,
      TODO_SESSION_HEARTBEAT_MS,
    );

    window.addEventListener("focus", touchBrowserSessionMarker);
    document.addEventListener("visibilitychange", touchBrowserSessionMarker);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", touchBrowserSessionMarker);
      document.removeEventListener("visibilitychange", touchBrowserSessionMarker);
    };
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    window.localStorage.setItem(
      TODO_SNAPSHOT_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  }, [isInitialized, snapshot]);

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
