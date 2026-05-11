import {
  createTodoItem,
  createTodoList,
  setTodoItemDone,
  setTodoItemTitle,
  setTodoListTitle,
} from "@/app/actions/todos";
import type { SyncOperation } from "@/lib/todos/sync-queue-storage";

export async function dispatchSyncOperation(operation: SyncOperation) {
  switch (operation.type) {
    case "createTodoList":
      return createTodoList(operation.payload);
    case "createTodoItem":
      return createTodoItem(operation.payload);
    case "setTodoItemDone":
      return setTodoItemDone(operation.payload);
    case "setTodoListTitle":
      return setTodoListTitle(operation.payload);
    case "setTodoItemTitle":
      return setTodoItemTitle(operation.payload);
  }
}
