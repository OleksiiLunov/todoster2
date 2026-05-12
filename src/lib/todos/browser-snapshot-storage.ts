import type { TodoSnapshot, TodoTrashSnapshot } from "@/lib/todos/types";

export const TODO_SNAPSHOT_STORAGE_KEY = "todoster:snapshot:v1";
export const TODO_TRASH_SNAPSHOT_STORAGE_KEY = "todoster:trash-snapshot:v1";

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

function isTodoTrashSnapshot(value: unknown): value is TodoTrashSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.userId !== "string" ||
    typeof value.bootstrappedAt !== "string" ||
    !Array.isArray(value.lists) ||
    !Array.isArray(value.items)
  ) {
    return false;
  }

  return (
    value.lists.every(
      (list) =>
        isRecord(list) &&
        typeof list.id === "string" &&
        typeof list.title === "string" &&
        typeof list.position === "number" &&
        typeof list.createdAt === "string" &&
        typeof list.updatedAt === "string" &&
        typeof list.deletedAt === "string",
    ) &&
    value.items.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.listId === "string" &&
        typeof item.listTitle === "string" &&
        typeof item.title === "string" &&
        typeof item.position === "number" &&
        typeof item.isDone === "boolean" &&
        typeof item.createdAt === "string" &&
        typeof item.updatedAt === "string" &&
        typeof item.deletedAt === "string",
    )
  );
}

export function parseTodoSnapshot(rawSnapshot: string) {
  try {
    const parsedSnapshot: unknown = JSON.parse(rawSnapshot);
    return isTodoSnapshot(parsedSnapshot) ? parsedSnapshot : null;
  } catch {
    return null;
  }
}

export function parseTodoTrashSnapshot(rawSnapshot: string) {
  try {
    const parsedSnapshot: unknown = JSON.parse(rawSnapshot);
    return isTodoTrashSnapshot(parsedSnapshot) ? parsedSnapshot : null;
  } catch {
    return null;
  }
}

export function readStoredTodoSnapshot() {
  const rawSnapshot = window.localStorage.getItem(TODO_SNAPSHOT_STORAGE_KEY);

  if (!rawSnapshot) {
    return null;
  }

  return parseTodoSnapshot(rawSnapshot);
}

export function readStoredTodoTrashSnapshot() {
  const rawSnapshot = window.localStorage.getItem(
    TODO_TRASH_SNAPSHOT_STORAGE_KEY,
  );

  if (!rawSnapshot) {
    return null;
  }

  return parseTodoTrashSnapshot(rawSnapshot);
}

export function stringifyTodoSnapshot(snapshot: TodoSnapshot) {
  return JSON.stringify(snapshot);
}

export function stringifyTodoTrashSnapshot(snapshot: TodoTrashSnapshot) {
  return JSON.stringify(snapshot);
}

export function writeTodoSnapshot(snapshot: TodoSnapshot) {
  const serializedSnapshot = stringifyTodoSnapshot(snapshot);

  window.localStorage.setItem(TODO_SNAPSHOT_STORAGE_KEY, serializedSnapshot);

  return serializedSnapshot;
}

export function writeTodoTrashSnapshot(snapshot: TodoTrashSnapshot) {
  const serializedSnapshot = stringifyTodoTrashSnapshot(snapshot);

  window.localStorage.setItem(
    TODO_TRASH_SNAPSHOT_STORAGE_KEY,
    serializedSnapshot,
  );

  return serializedSnapshot;
}
