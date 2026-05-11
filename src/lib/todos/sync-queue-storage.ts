export const TODO_SYNC_QUEUE_STORAGE_KEY = "todoster:sync-queue:v1";

export type SyncOperation =
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
    }
  | {
      createdAt: string;
      id: string;
      payload: {
        id: string;
      };
      type: "deleteTodoList";
    }
  | {
      createdAt: string;
      id: string;
      payload: {
        id: string;
      };
      type: "deleteTodoItem";
    }
  | {
      createdAt: string;
      id: string;
      payload: {
        lists: Array<{
          id: string;
          position: number;
        }>;
      };
      type: "setTodoListPositions";
    }
  | {
      createdAt: string;
      id: string;
      payload: {
        items: Array<{
          id: string;
          position: number;
        }>;
        listId: string;
      };
      type: "setTodoItemPositions";
    };

export function createSyncOperationId() {
  return `sync_${crypto.randomUUID()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidPosition(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.length > 0;
}

function isSyncOperation(value: unknown): value is SyncOperation {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.createdAt)
  ) {
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
    case "deleteTodoList":
    case "deleteTodoItem":
      return isNonEmptyString(value.payload.id);
    case "setTodoListPositions":
      return (
        Array.isArray(value.payload.lists) &&
        value.payload.lists.every(
          (list) =>
            isRecord(list) &&
            isNonEmptyString(list.id) &&
            isValidPosition(list.position),
        )
      );
    case "setTodoItemPositions":
      return (
        isNonEmptyString(value.payload.listId) &&
        Array.isArray(value.payload.items) &&
        value.payload.items.every(
          (item) =>
            isRecord(item) &&
            isNonEmptyString(item.id) &&
            isValidPosition(item.position),
        )
      );
    default:
      return false;
  }
}

export function parseSyncQueue(rawQueue: string) {
  try {
    const parsedQueue: unknown = JSON.parse(rawQueue);
    return Array.isArray(parsedQueue) ? parsedQueue.filter(isSyncOperation) : [];
  } catch {
    return [];
  }
}

export function readSyncQueue() {
  const rawQueue = window.localStorage.getItem(TODO_SYNC_QUEUE_STORAGE_KEY);

  if (!rawQueue) {
    return [];
  }

  return parseSyncQueue(rawQueue);
}

export function writeSyncQueue(queue: SyncOperation[]) {
  window.localStorage.setItem(
    TODO_SYNC_QUEUE_STORAGE_KEY,
    JSON.stringify(queue),
  );
}
