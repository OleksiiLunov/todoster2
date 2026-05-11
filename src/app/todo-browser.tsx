"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  createTodoItem,
  createTodoList,
  setTodoItemDone as persistTodoItemDone,
  setTodoItemTitle as persistTodoItemTitle,
  setTodoListTitle as persistTodoListTitle,
} from "@/app/actions/todos";
import { TodoHeader } from "@/app/todos/todo-header";
import { TodoListPanel } from "@/app/todos/todo-list-panel";
import { TodoPanel } from "@/app/todos/todo-panel";
import type { TodoSnapshot } from "@/lib/todos/types";

const TODO_SNAPSHOT_STORAGE_KEY = "todoster:snapshot:v1";
const TODO_SYNC_QUEUE_STORAGE_KEY = "todoster:sync-queue:v1";
const TODO_SESSION_MARKER_STORAGE_KEY = "todoster:browser-session:v1";
const TODO_SESSION_TTL_MS = 30 * 60 * 1000;
const TODO_SESSION_HEARTBEAT_MS = 30 * 1000;
export const MAX_TODO_TITLE_LENGTH = 120;

type PersistenceResult = {
  error?: string;
  ok: boolean;
};

type SyncOperation =
  | {
      createdAt: string;
      id: string;
      payload: {
        id: string;
        position: number;
        title: string;
      };
      type: "createTodoList";
    }
  | {
      createdAt: string;
      id: string;
      payload: {
        id: string;
        listId: string;
        position: number;
        title: string;
      };
      type: "createTodoItem";
    }
  | {
      createdAt: string;
      id: string;
      payload: {
        id: string;
        isDone: boolean;
      };
      type: "setTodoItemDone";
    }
  | {
      createdAt: string;
      id: string;
      payload: {
        id: string;
        title: string;
      };
      type: "setTodoListTitle";
    }
  | {
      createdAt: string;
      id: string;
      payload: {
        id: string;
        title: string;
      };
      type: "setTodoItemTitle";
    };

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

function createSyncOperationId() {
  return `sync_${crypto.randomUUID()}`;
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

  return parseTodoSnapshot(rawSnapshot);
}

function parseTodoSnapshot(rawSnapshot: string) {
  try {
    const parsedSnapshot: unknown = JSON.parse(rawSnapshot);
    return isTodoSnapshot(parsedSnapshot) ? parsedSnapshot : null;
  } catch {
    return null;
  }
}

function stringifyTodoSnapshot(snapshot: TodoSnapshot) {
  return JSON.stringify(snapshot);
}

function writeTodoSnapshot(snapshot: TodoSnapshot) {
  const serializedSnapshot = stringifyTodoSnapshot(snapshot);

  window.localStorage.setItem(TODO_SNAPSHOT_STORAGE_KEY, serializedSnapshot);

  return serializedSnapshot;
}

function parseSyncQueue(rawQueue: string) {
  try {
    const parsedQueue: unknown = JSON.parse(rawQueue);
    return Array.isArray(parsedQueue) ? parsedQueue.filter(isSyncOperation) : [];
  } catch {
    return [];
  }
}

function isValidPosition(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.length > 0;
}

function isSyncOperation(value: unknown): value is SyncOperation {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.createdAt)) {
    return false;
  }

  if (!isNonEmptyString(value.type) || !isRecord(value.payload)) {
    return false;
  }

  switch (value.type) {
    case "createTodoList":
      return (
        isNonEmptyString(value.payload.id) &&
        isValidPosition(value.payload.position) &&
        isNonEmptyString(value.payload.title)
      );
    case "createTodoItem":
      return (
        isNonEmptyString(value.payload.id) &&
        isNonEmptyString(value.payload.listId) &&
        isValidPosition(value.payload.position) &&
        isNonEmptyString(value.payload.title)
      );
    case "setTodoItemDone":
      return (
        isNonEmptyString(value.payload.id) &&
        typeof value.payload.isDone === "boolean"
      );
    case "setTodoListTitle":
    case "setTodoItemTitle":
      return (
        isNonEmptyString(value.payload.id) &&
        isNonEmptyString(value.payload.title)
      );
    default:
      return false;
  }
}

function readSyncQueue() {
  const rawQueue = window.localStorage.getItem(TODO_SYNC_QUEUE_STORAGE_KEY);

  if (!rawQueue) {
    return [];
  }

  return parseSyncQueue(rawQueue);
}

function writeSyncQueue(queue: SyncOperation[]) {
  window.localStorage.setItem(
    TODO_SYNC_QUEUE_STORAGE_KEY,
    JSON.stringify(queue),
  );
}

async function dispatchSyncOperation(operation: SyncOperation) {
  switch (operation.type) {
    case "createTodoList":
      return createTodoList(operation.payload);
    case "createTodoItem":
      return createTodoItem(operation.payload);
    case "setTodoItemDone":
      return persistTodoItemDone(operation.payload);
    case "setTodoListTitle":
      return persistTodoListTitle(operation.payload);
    case "setTodoItemTitle":
      return persistTodoItemTitle(operation.payload);
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

  return parseBrowserSessionMarker(rawMarker);
}

function parseBrowserSessionMarker(rawMarker: string) {
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

function getPersistenceErrorMessage(result: PersistenceResult) {
  return result.error ?? "Could not save changes. Please try again.";
}

export function TodoBrowser({ bootstrap }: TodoBrowserProps) {
  const [snapshot, setSnapshot] = useState<TodoSnapshot>(bootstrap);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncError, setSyncError] = useState("");
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
  const isDispatchingQueue = useRef(false);
  const lastWrittenSnapshotJson = useRef("");

  useEffect(() => {
    const now = Date.now();
    const sessionMarker = readStoredBrowserSessionMarker();
    const sessionIsActive = isBrowserSessionActive(sessionMarker, now);
    const storedSnapshot = sessionIsActive ? readStoredTodoSnapshot() : null;
    const initialSnapshot = storedSnapshot ?? bootstrap;

    setSnapshot(initialSnapshot);
    lastWrittenSnapshotJson.current = writeTodoSnapshot(initialSnapshot);
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

    const serializedSnapshot = stringifyTodoSnapshot(snapshot);

    if (serializedSnapshot === lastWrittenSnapshotJson.current) {
      return;
    }

    window.localStorage.setItem(TODO_SNAPSHOT_STORAGE_KEY, serializedSnapshot);
    lastWrittenSnapshotJson.current = serializedSnapshot;
  }, [isInitialized, snapshot]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    void processSyncQueue();
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    function retryPendingSyncQueue() {
      if (readSyncQueue().length === 0) {
        return;
      }

      void processSyncQueue();
    }

    function retryPendingSyncQueueWhenVisible() {
      if (document.visibilityState !== "visible") {
        return;
      }

      retryPendingSyncQueue();
    }

    window.addEventListener("online", retryPendingSyncQueue);
    window.addEventListener("focus", retryPendingSyncQueue);
    document.addEventListener(
      "visibilitychange",
      retryPendingSyncQueueWhenVisible,
    );

    return () => {
      window.removeEventListener("online", retryPendingSyncQueue);
      window.removeEventListener("focus", retryPendingSyncQueue);
      document.removeEventListener(
        "visibilitychange",
        retryPendingSyncQueueWhenVisible,
      );
    };
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    function handleStorageEvent(event: StorageEvent) {
      if (event.storageArea !== window.localStorage || !event.key) {
        return;
      }

      if (event.key === TODO_SNAPSHOT_STORAGE_KEY) {
        if (!event.newValue || event.newValue === lastWrittenSnapshotJson.current) {
          return;
        }

        const nextSnapshot = parseTodoSnapshot(event.newValue);

        if (!nextSnapshot) {
          return;
        }

        lastWrittenSnapshotJson.current = event.newValue;
        setSnapshot(nextSnapshot);
        setSelectedListId((currentSelectedListId) => {
          if (
            currentSelectedListId &&
            nextSnapshot.lists.some((list) => list.id === currentSelectedListId)
          ) {
            return currentSelectedListId;
          }

          return nextSnapshot.lists[0]?.id ?? null;
        });
        return;
      }

      if (event.key === TODO_SYNC_QUEUE_STORAGE_KEY) {
        if (!event.newValue) {
          setSyncError("");
          return;
        }

        const queue = parseSyncQueue(event.newValue);

        if (queue.length === 0) {
          setSyncError("");
          return;
        }

        void processSyncQueue();
        return;
      }

      if (event.key === TODO_SESSION_MARKER_STORAGE_KEY && event.newValue) {
        parseBrowserSessionMarker(event.newValue);
      }
    }

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [isInitialized]);

  const totalItems = snapshot.lists.reduce(
    (count, list) => count + list.items.length,
    0,
  );
  const selectedList =
    snapshot.lists.find((list) => list.id === selectedListId) ?? null;

  async function processSyncQueue() {
    if (isDispatchingQueue.current) {
      return;
    }

    isDispatchingQueue.current = true;

    try {
      while (true) {
        const operation = readSyncQueue()[0];

        if (!operation) {
          setSyncError("");
          return;
        }

        const result = await dispatchSyncOperation(operation);

        if (result.ok) {
          const nextQueue = readSyncQueue().filter(
            (queuedOperation) => queuedOperation.id !== operation.id,
          );
          writeSyncQueue(nextQueue);
          setSyncError("");
          continue;
        }

        setSyncError(getPersistenceErrorMessage(result));
        return;
      }
    } catch {
      setSyncError("Could not save changes. Please try again.");
    } finally {
      isDispatchingQueue.current = false;
    }
  }

  function enqueueSyncOperation(operation: SyncOperation) {
    const queue = readSyncQueue();
    const operationAlreadyQueued = queue.some(
      (queuedOperation) => queuedOperation.id === operation.id,
    );

    if (!operationAlreadyQueued) {
      writeSyncQueue([...queue, operation]);
    }

    void processSyncQueue();
  }

  function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateTitle(listTitle);
    if (validation.error) {
      setListError(validation.error);
      return;
    }

    const now = new Date().toISOString();
    const listId = createBrowserId("list");
    const position = snapshot.lists.length;

    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      lists: [
        ...currentSnapshot.lists,
        {
          id: listId,
          title: validation.title,
          position,
          createdAt: now,
          updatedAt: now,
          items: [],
        },
      ],
    }));
    setSelectedListId(listId);
    setListTitle("");
    setListError("");
    enqueueSyncOperation({
      createdAt: now,
      id: createSyncOperationId(),
      payload: {
        id: listId,
        position,
        title: validation.title,
      },
      type: "createTodoList",
    });
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
    const targetList = snapshot.lists.find((list) => list.id === listId);

    if (!targetList) {
      setSyncError("Could not save changes. List was not found.");
      return;
    }

    const itemId = createBrowserId("item");
    const position = targetList.items.length;

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
                  id: itemId,
                  title: validation.title,
                  position,
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
    enqueueSyncOperation({
      createdAt: now,
      id: createSyncOperationId(),
      payload: {
        id: itemId,
        listId,
        position,
        title: validation.title,
      },
      type: "createTodoItem",
    });
  }

  function setTodoDone(listId: string, itemId: string, isDone: boolean) {
    if (typeof isDone !== "boolean") {
      return;
    }

    const targetList = snapshot.lists.find((list) => list.id === listId);
    const targetItem = targetList?.items.find((item) => item.id === itemId);

    if (!targetList || !targetItem || targetItem.isDone === isDone) {
      return;
    }

    setSnapshot((currentSnapshot) => {
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
    enqueueSyncOperation({
      createdAt: new Date().toISOString(),
      id: createSyncOperationId(),
      payload: {
        id: itemId,
        isDone,
      },
      type: "setTodoItemDone",
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

    const targetList = snapshot.lists.find((list) => list.id === listId);

    if (!targetList || targetList.title === validation.title) {
      setListRenameErrors((currentErrors) => ({
        ...currentErrors,
        [listId]: "",
      }));
      return;
    }

    setSnapshot((currentSnapshot) => {
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
    enqueueSyncOperation({
      createdAt: new Date().toISOString(),
      id: createSyncOperationId(),
      payload: {
        id: listId,
        title: validation.title,
      },
      type: "setTodoListTitle",
    });
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

    const targetList = snapshot.lists.find((list) => list.id === listId);
    const targetItem = targetList?.items.find((item) => item.id === itemId);

    if (!targetList || !targetItem || targetItem.title === validation.title) {
      setItemRenameErrors((currentErrors) => ({
        ...currentErrors,
        [itemId]: "",
      }));
      return;
    }

    setSnapshot((currentSnapshot) => {
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
    enqueueSyncOperation({
      createdAt: new Date().toISOString(),
      id: createSyncOperationId(),
      payload: {
        id: itemId,
        title: validation.title,
      },
      type: "setTodoItemTitle",
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10">
      <TodoHeader listCount={snapshot.lists.length} todoCount={totalItems} />

      {syncError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {syncError}
        </p>
      ) : null}

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
