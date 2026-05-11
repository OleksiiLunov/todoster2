import type { TodoSnapshot } from "@/lib/todos/types";

export const TODO_SNAPSHOT_STORAGE_KEY = "todoster:snapshot:v1";

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

export function parseTodoSnapshot(rawSnapshot: string) {
  try {
    const parsedSnapshot: unknown = JSON.parse(rawSnapshot);
    return isTodoSnapshot(parsedSnapshot) ? parsedSnapshot : null;
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

export function stringifyTodoSnapshot(snapshot: TodoSnapshot) {
  return JSON.stringify(snapshot);
}

export function writeTodoSnapshot(snapshot: TodoSnapshot) {
  const serializedSnapshot = stringifyTodoSnapshot(snapshot);

  window.localStorage.setItem(TODO_SNAPSHOT_STORAGE_KEY, serializedSnapshot);

  return serializedSnapshot;
}
