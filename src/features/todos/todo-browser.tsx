"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { TodoHeader } from "@/features/todos/components/todo-header";
import { TodoListPanel } from "@/features/todos/components/todo-list-panel";
import {
  TodoPanel,
  type TodoItemStatusFilter,
} from "@/features/todos/components/todo-panel";
import { TodoTrashPanel } from "@/features/todos/components/todo-trash-panel";
import {
  TODO_SNAPSHOT_STORAGE_KEY,
  TODO_TRASH_SNAPSHOT_STORAGE_KEY,
  parseTodoSnapshot,
  parseTodoTrashSnapshot,
  readStoredTodoSnapshot,
  readStoredTodoTrashSnapshot,
  stringifyTodoSnapshot,
  stringifyTodoTrashSnapshot,
  writeTodoSnapshot,
  writeTodoTrashSnapshot,
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
  createTodoItemSnapshot,
  createTodoListSnapshot,
  deleteTodoItemSnapshot,
  deleteTodoListSnapshot,
  reorderTodoItemsSnapshot,
  reorderTodoListsSnapshot,
  setTodoItemDoneSnapshot,
  setTodoItemsDoneSnapshot,
  setTodoItemTitleSnapshot,
  setTodoListTitleSnapshot,
} from "@/lib/todos/local-mutations";
import {
  TODO_SYNC_QUEUE_STORAGE_KEY,
  createSyncOperationId,
  parseSyncQueue,
  readSyncQueue,
  type SyncOperation,
  writeSyncQueue,
} from "@/lib/todos/sync-queue-storage";
import type {
  TodoBootstrap,
  TodoListSnapshot,
  TodoSnapshot,
  TodoTrashSnapshot,
} from "@/lib/todos/types";

export const MAX_TODO_TITLE_LENGTH = 120;

type PersistenceResult = {
  error?: string;
  ok: boolean;
};

type TodoBrowserProps = {
  bootstrap: TodoBootstrap;
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

function reorderTodoListsToIndex(
  snapshot: TodoSnapshot,
  listId: string,
  targetIndex: number,
) {
  let nextSnapshot = snapshot;
  let currentIndex = nextSnapshot.lists.findIndex((list) => list.id === listId);

  while (currentIndex !== -1 && currentIndex < targetIndex) {
    nextSnapshot = reorderTodoListsSnapshot(nextSnapshot, {
      direction: "down",
      listId,
    });
    currentIndex += 1;
  }

  while (currentIndex !== -1 && currentIndex > targetIndex) {
    nextSnapshot = reorderTodoListsSnapshot(nextSnapshot, {
      direction: "up",
      listId,
    });
    currentIndex -= 1;
  }

  return nextSnapshot;
}

function reorderTodoItemsToIndex(
  snapshot: TodoSnapshot,
  input: {
    itemId: string;
    listId: string;
    now: string;
    targetIndex: number;
  },
) {
  let nextSnapshot = snapshot;
  let currentIndex =
    nextSnapshot.lists
      .find((list) => list.id === input.listId)
      ?.items.findIndex((item) => item.id === input.itemId) ?? -1;

  while (currentIndex !== -1 && currentIndex < input.targetIndex) {
    nextSnapshot = reorderTodoItemsSnapshot(nextSnapshot, {
      direction: "down",
      itemId: input.itemId,
      listId: input.listId,
      now: input.now,
    });
    currentIndex += 1;
  }

  while (currentIndex !== -1 && currentIndex > input.targetIndex) {
    nextSnapshot = reorderTodoItemsSnapshot(nextSnapshot, {
      direction: "up",
      itemId: input.itemId,
      listId: input.listId,
      now: input.now,
    });
    currentIndex -= 1;
  }

  return nextSnapshot;
}

export function TodoBrowser({ bootstrap }: TodoBrowserProps) {
  const [snapshot, setSnapshot] = useState<TodoSnapshot>(bootstrap.snapshot);
  const [trash, setTrash] = useState<TodoTrashSnapshot>(bootstrap.trash);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [listTitle, setListTitle] = useState("");
  const [listError, setListError] = useState("");
  const [itemTitles, setItemTitles] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [itemStatusFilter, setItemStatusFilter] =
    useState<TodoItemStatusFilter>("all");
  const [listRenameErrors, setListRenameErrors] = useState<
    Record<string, string>
  >({});
  const [itemRenameErrors, setItemRenameErrors] = useState<
    Record<string, string>
  >({});
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isTrashVisible, setIsTrashVisible] = useState(false);
  const isDispatchingQueue = useRef(false);
  const lastWrittenSnapshotJson = useRef("");
  const lastWrittenTrashSnapshotJson = useRef("");

  useEffect(() => {
    const now = Date.now();
    const sessionMarker = readStoredBrowserSessionMarker();
    const sessionIsActive = isBrowserSessionActive(sessionMarker, now);
    const storedSnapshot = sessionIsActive ? readStoredTodoSnapshot() : null;
    const storedTrash = sessionIsActive ? readStoredTodoTrashSnapshot() : null;
    const initialSnapshot = storedSnapshot ?? bootstrap.snapshot;
    const initialTrash = storedTrash ?? bootstrap.trash;

    setSnapshot(initialSnapshot);
    setTrash(initialTrash);
    lastWrittenSnapshotJson.current = writeTodoSnapshot(initialSnapshot);
    lastWrittenTrashSnapshotJson.current = writeTodoTrashSnapshot(initialTrash);
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

    const serializedSnapshot = stringifyTodoTrashSnapshot(trash);

    if (serializedSnapshot === lastWrittenTrashSnapshotJson.current) {
      return;
    }

    window.localStorage.setItem(
      TODO_TRASH_SNAPSHOT_STORAGE_KEY,
      serializedSnapshot,
    );
    lastWrittenTrashSnapshotJson.current = serializedSnapshot;
  }, [isInitialized, trash]);

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

      if (event.key === TODO_TRASH_SNAPSHOT_STORAGE_KEY) {
        if (
          !event.newValue ||
          event.newValue === lastWrittenTrashSnapshotJson.current
        ) {
          return;
        }

        const nextTrash = parseTodoTrashSnapshot(event.newValue);

        if (!nextTrash) {
          return;
        }

        lastWrittenTrashSnapshotJson.current = event.newValue;
        setTrash(nextTrash);
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
  const trashItemCount = trash.lists.length + trash.items.length;

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

  function addDeletedListToTrash(list: TodoListSnapshot, deletedAt: string) {
    setTrash((currentTrash) => {
      const trashedList = {
        id: list.id,
        title: list.title,
        position: list.position,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        deletedAt,
      };
      const trashedItems = list.items.map((item) => ({
        ...item,
        deletedAt,
        listId: list.id,
        listTitle: list.title,
      }));
      const trashedItemIds = new Set(trashedItems.map((item) => item.id));

      return {
        ...currentTrash,
        lists: [
          trashedList,
          ...currentTrash.lists.filter(
            (trashList) => trashList.id !== list.id,
          ),
        ],
        items: [
          ...trashedItems,
          ...currentTrash.items.filter(
            (trashItem) => !trashedItemIds.has(trashItem.id),
          ),
        ],
      };
    });
  }

  function addDeletedItemToTrash(
    list: TodoListSnapshot,
    itemId: string,
    deletedAt: string,
  ) {
    const item = list.items.find((listItem) => listItem.id === itemId);

    if (!item) {
      return;
    }

    setTrash((currentTrash) => ({
      ...currentTrash,
      items: [
        {
          ...item,
          deletedAt,
          listId: list.id,
          listTitle: list.title,
        },
        ...currentTrash.items.filter((trashItem) => trashItem.id !== item.id),
      ],
    }));
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

    setSnapshot(
      createTodoListSnapshot(snapshot, {
        id: listId,
        now,
        position,
        title: validation.title,
      }),
    );
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

    setSnapshot(
      createTodoItemSnapshot(snapshot, {
        id: itemId,
        listId,
        now,
        position,
        title: validation.title,
      }),
    );
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

    const now = new Date().toISOString();

    setSnapshot(
      setTodoItemDoneSnapshot(snapshot, {
        isDone,
        itemId,
        listId,
        now,
      }),
    );
    enqueueSyncOperation({
      createdAt: now,
      id: createSyncOperationId(),
      payload: {
        id: itemId,
        isDone,
      },
      type: "setTodoItemDone",
    });
  }

  function uncheckAllTodoItems(listId: string) {
    const targetList = snapshot.lists.find((list) => list.id === listId);
    const completedItems =
      targetList?.items.filter((item) => item.isDone) ?? [];

    if (!targetList || completedItems.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const itemIds = completedItems.map((item) => item.id);

    setSnapshot(
      setTodoItemsDoneSnapshot(snapshot, {
        isDone: false,
        itemIds,
        listId,
        now,
      }),
    );
    enqueueSyncOperation({
      createdAt: now,
      id: createSyncOperationId(),
      payload: {
        ids: itemIds,
        isDone: false,
        listId,
      },
      type: "setTodoItemsDone",
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

    const now = new Date().toISOString();

    setSnapshot(
      setTodoListTitleSnapshot(snapshot, {
        listId,
        now,
        title: validation.title,
      }),
    );
    setListRenameErrors((currentErrors) => ({
      ...currentErrors,
      [listId]: "",
    }));
    enqueueSyncOperation({
      createdAt: now,
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

    const now = new Date().toISOString();

    setSnapshot(
      setTodoItemTitleSnapshot(snapshot, {
        itemId,
        listId,
        now,
        title: validation.title,
      }),
    );
    setItemRenameErrors((currentErrors) => ({
      ...currentErrors,
      [itemId]: "",
    }));
    enqueueSyncOperation({
      createdAt: now,
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
    const deletedList = snapshot.lists[deletedListIndex];
    const nextSelectedListId =
      selectedListId === listId
        ? (remainingLists[deletedListIndex]?.id ??
          remainingLists[deletedListIndex - 1]?.id ??
          null)
        : selectedListId;
    const now = new Date().toISOString();

    addDeletedListToTrash(deletedList, now);
    setSnapshot(deleteTodoListSnapshot(snapshot, { listId }));
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
      createdAt: now,
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

    const now = new Date().toISOString();

    addDeletedItemToTrash(targetList, itemId, now);
    setSnapshot(deleteTodoItemSnapshot(snapshot, { itemId, listId, now }));
    setItemRenameErrors((currentErrors) => {
      const { [itemId]: _deletedItemError, ...remainingErrors } =
        currentErrors;
      return remainingErrors;
    });
    enqueueSyncOperation({
      createdAt: now,
      id: createSyncOperationId(),
      payload: {
        id: itemId,
      },
      type: "deleteTodoItem",
    });
  }

  function permanentlyDeleteTodoList(listId: string) {
    const targetList = trash.lists.find((list) => list.id === listId);

    if (!targetList) {
      return;
    }

    const now = new Date().toISOString();

    setTrash((currentTrash) => ({
      ...currentTrash,
      lists: currentTrash.lists.filter((list) => list.id !== listId),
      items: currentTrash.items.filter((item) => item.listId !== listId),
    }));
    enqueueSyncOperation({
      createdAt: now,
      id: createSyncOperationId(),
      payload: {
        id: listId,
      },
      type: "permanentlyDeleteTodoList",
    });
  }

  function permanentlyDeleteTodoItem(itemId: string) {
    const targetItem = trash.items.find((item) => item.id === itemId);

    if (!targetItem) {
      return;
    }

    const now = new Date().toISOString();

    setTrash((currentTrash) => ({
      ...currentTrash,
      items: currentTrash.items.filter((item) => item.id !== itemId),
    }));
    enqueueSyncOperation({
      createdAt: now,
      id: createSyncOperationId(),
      payload: {
        id: itemId,
      },
      type: "permanentlyDeleteTodoItem",
    });
  }

  function persistTodoListPositions(nextSnapshot: TodoSnapshot, now: string) {
    enqueueSyncOperation({
      createdAt: now,
      id: createSyncOperationId(),
      payload: {
        lists: nextSnapshot.lists.map((list) => ({
          id: list.id,
          position: list.position,
        })),
      },
      type: "setTodoListPositions",
    });
  }

  function persistTodoItemPositions(
    nextSnapshot: TodoSnapshot,
    listId: string,
    now: string,
  ) {
    const nextItems =
      nextSnapshot.lists.find((list) => list.id === listId)?.items ?? [];

    enqueueSyncOperation({
      createdAt: now,
      id: createSyncOperationId(),
      payload: {
        items: nextItems.map((item) => ({
          id: item.id,
          position: item.position,
        })),
        listId,
      },
      type: "setTodoItemPositions",
    });
  }

  function reorderTodoList(listId: string, targetListId: string) {
    const currentIndex = snapshot.lists.findIndex((list) => list.id === listId);
    const targetIndex = snapshot.lists.findIndex(
      (list) => list.id === targetListId,
    );

    if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) {
      return;
    }

    const now = new Date().toISOString();
    const nextSnapshot = reorderTodoListsToIndex(snapshot, listId, targetIndex);

    setSnapshot(nextSnapshot);
    persistTodoListPositions(nextSnapshot, now);
  }

  function reorderTodoItem(listId: string, itemId: string, targetItemId: string) {
    const targetList = snapshot.lists.find((list) => list.id === listId);
    const currentIndex =
      targetList?.items.findIndex((item) => item.id === itemId) ?? -1;
    const targetIndex =
      targetList?.items.findIndex((item) => item.id === targetItemId) ?? -1;

    if (!targetList || currentIndex === -1 || targetIndex === -1) {
      return;
    }

    if (currentIndex === targetIndex) {
      return;
    }

    const now = new Date().toISOString();
    const nextSnapshot = reorderTodoItemsToIndex(snapshot, {
      itemId,
      listId,
      now,
      targetIndex,
    });

    setSnapshot(nextSnapshot);
    persistTodoItemPositions(nextSnapshot, listId, now);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <TodoHeader listCount={snapshot.lists.length} todoCount={totalItems} />
        <button
          aria-expanded={isTrashVisible}
          className="h-10 self-start rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 sm:self-auto"
          onClick={() => setIsTrashVisible((isVisible) => !isVisible)}
          type="button"
        >
          {isTrashVisible ? "Hide Trash" : `Show Trash (${trashItemCount})`}
        </button>
      </div>

      {syncError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {syncError}
        </p>
      ) : null}

      <section
        className={`grid min-h-[28rem] gap-4 ${
          isTrashVisible
            ? "xl:grid-cols-[20rem_minmax(0,1fr)_22rem]"
            : "lg:grid-cols-[20rem_minmax(0,1fr)]"
        }`}
      >
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
          onReorderTodoList={reorderTodoList}
          onSelectList={setSelectedListId}
          selectedListId={selectedListId}
        />

        <TodoPanel
          itemError={selectedList ? (itemErrors[selectedList.id] ?? "") : ""}
          itemStatusFilter={itemStatusFilter}
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
          onItemStatusFilterChange={setItemStatusFilter}
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
          onReorderTodoItem={
            selectedList
              ? (itemId, targetItemId) =>
                  reorderTodoItem(selectedList.id, itemId, targetItemId)
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
          onUncheckAllItems={
            selectedList ? () => uncheckAllTodoItems(selectedList.id) : undefined
          }
        />

        {isTrashVisible ? (
          <TodoTrashPanel
            onPermanentlyDeleteTodoItem={permanentlyDeleteTodoItem}
            onPermanentlyDeleteTodoList={permanentlyDeleteTodoList}
            trash={trash}
          />
        ) : null}
      </section>
    </main>
  );
}
