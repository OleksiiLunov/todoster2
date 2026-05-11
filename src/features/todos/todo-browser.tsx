"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { TodoHeader } from "@/features/todos/components/todo-header";
import { TodoListPanel } from "@/features/todos/components/todo-list-panel";
import { TodoPanel } from "@/features/todos/components/todo-panel";
import {
  TODO_SNAPSHOT_STORAGE_KEY,
  parseTodoSnapshot,
  readStoredTodoSnapshot,
  stringifyTodoSnapshot,
  writeTodoSnapshot,
} from "@/lib/todos/browser-snapshot-storage";
import {
  TODO_SESSION_HEARTBEAT_MS,
  TODO_SESSION_MARKER_STORAGE_KEY,
  isBrowserSessionActive,
  parseBrowserSessionMarker,
  readStoredBrowserSessionMarker,
  touchBrowserSessionMarker,
  writeBrowserSessionMarker,
} from "@/lib/todos/browser-session-storage";
import { dispatchSyncOperation } from "@/lib/todos/sync-operation-dispatch";
import {
  TODO_SYNC_QUEUE_STORAGE_KEY,
  createSyncOperationId,
  parseSyncQueue,
  readSyncQueue,
  type SyncOperation,
  writeSyncQueue,
} from "@/lib/todos/sync-queue-storage";
import type { TodoSnapshot } from "@/lib/todos/types";

export const MAX_TODO_TITLE_LENGTH = 120;

type PersistenceResult = {
  error?: string;
  ok: boolean;
};

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

  function deleteTodoList(listId: string) {
    const deletedListIndex = snapshot.lists.findIndex(
      (list) => list.id === listId,
    );

    if (deletedListIndex === -1) {
      return;
    }

    const remainingLists = snapshot.lists.filter((list) => list.id !== listId);
    const nextSelectedListId =
      selectedListId === listId
        ? (remainingLists[deletedListIndex]?.id ??
          remainingLists[deletedListIndex - 1]?.id ??
          null)
        : selectedListId;

    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      lists: currentSnapshot.lists.filter((list) => list.id !== listId),
    }));
    setSelectedListId(nextSelectedListId);
    setItemTitles((currentTitles) => {
      const { [listId]: _deletedListTitle, ...remainingTitles } =
        currentTitles;
      return remainingTitles;
    });
    setItemErrors((currentErrors) => {
      const { [listId]: _deletedListError, ...remainingErrors } =
        currentErrors;
      return remainingErrors;
    });
    setListRenameErrors((currentErrors) => {
      const { [listId]: _deletedListError, ...remainingErrors } =
        currentErrors;
      return remainingErrors;
    });
    setItemRenameErrors((currentErrors) => {
      const deletedItemIds = new Set(
        snapshot.lists[deletedListIndex]?.items.map((item) => item.id) ?? [],
      );

      return Object.fromEntries(
        Object.entries(currentErrors).filter(
          ([itemId]) => !deletedItemIds.has(itemId),
        ),
      );
    });
    enqueueSyncOperation({
      createdAt: new Date().toISOString(),
      id: createSyncOperationId(),
      payload: {
        id: listId,
      },
      type: "deleteTodoList",
    });
  }

  function deleteTodoItem(listId: string, itemId: string) {
    const targetList = snapshot.lists.find((list) => list.id === listId);
    const targetItem = targetList?.items.find((item) => item.id === itemId);

    if (!targetList || !targetItem) {
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
                items: list.items.filter((item) => item.id !== itemId),
              }
            : list,
        ),
      };
    });
    setItemRenameErrors((currentErrors) => {
      const { [itemId]: _deletedItemError, ...remainingErrors } =
        currentErrors;
      return remainingErrors;
    });
    enqueueSyncOperation({
      createdAt: new Date().toISOString(),
      id: createSyncOperationId(),
      payload: {
        id: itemId,
      },
      type: "deleteTodoItem",
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
          onDeleteTodoItem={
            selectedList
              ? (itemId) => deleteTodoItem(selectedList.id, itemId)
              : undefined
          }
          onDeleteTodoList={
            selectedList ? () => deleteTodoList(selectedList.id) : undefined
          }
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
