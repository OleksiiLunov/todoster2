import {
  createTodoItem,
  createTodoList,
  deleteTodoItem,
  deleteTodoList,
  permanentlyDeleteTodoItem,
  permanentlyDeleteTodoList,
  setTodoItemPositions,
  setTodoItemDone,
  setTodoItemsDone,
  setTodoItemTitle,
  setTodoListPositions,
  setTodoListTitle,
} from "@/app/actions/todos";
import type { SyncOperation } from "@/lib/todos/sync-queue-storage";

type PersistenceResult = {
  error?: string;
  ok: boolean;
};

const DISPATCH_ERROR = "Could not save changes. Please try again.";
const DISPATCH_TIMEOUT_MS = 3000;

function dispatchError(): PersistenceResult {
  return { error: DISPATCH_ERROR, ok: false };
}

function isPersistenceResult(value: unknown): value is PersistenceResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof value.ok === "boolean"
  );
}

async function dispatchServerAction(
  action: () => Promise<PersistenceResult>,
): Promise<PersistenceResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return dispatchError();
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    const result = await Promise.race([
      action(),
      new Promise<PersistenceResult>((resolve) => {
        timeoutId = setTimeout(() => {
          resolve(dispatchError());
        }, DISPATCH_TIMEOUT_MS);
      }),
    ]);

    return isPersistenceResult(result) ? result : dispatchError();
  } catch {
    return dispatchError();
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function dispatchSyncOperation(
  operation: SyncOperation,
): Promise<PersistenceResult> {
  switch (operation.type) {
    case "createTodoList":
      return dispatchServerAction(() => createTodoList(operation.payload));
    case "createTodoItem":
      return dispatchServerAction(() => createTodoItem(operation.payload));
    case "setTodoItemDone":
      return dispatchServerAction(() => setTodoItemDone(operation.payload));
    case "setTodoItemsDone":
      return dispatchServerAction(() => setTodoItemsDone(operation.payload));
    case "setTodoListTitle":
      return dispatchServerAction(() => setTodoListTitle(operation.payload));
    case "setTodoItemTitle":
      return dispatchServerAction(() => setTodoItemTitle(operation.payload));
    case "deleteTodoList":
      return dispatchServerAction(() => deleteTodoList(operation.payload));
    case "deleteTodoItem":
      return dispatchServerAction(() => deleteTodoItem(operation.payload));
    case "permanentlyDeleteTodoList":
      return dispatchServerAction(() =>
        permanentlyDeleteTodoList(operation.payload),
      );
    case "permanentlyDeleteTodoItem":
      return dispatchServerAction(() =>
        permanentlyDeleteTodoItem(operation.payload),
      );
    case "setTodoListPositions":
      return dispatchServerAction(() => setTodoListPositions(operation.payload));
    case "setTodoItemPositions":
      return dispatchServerAction(() => setTodoItemPositions(operation.payload));
  }
}
