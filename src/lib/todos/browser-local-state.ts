import {
  TODO_SNAPSHOT_STORAGE_KEY,
  TODO_TRASH_SNAPSHOT_STORAGE_KEY,
} from "@/lib/todos/browser-snapshot-storage";
import { TODO_SESSION_MARKER_STORAGE_KEY } from "@/lib/todos/browser-session-storage";
import { TODO_SYNC_QUEUE_STORAGE_KEY } from "@/lib/todos/sync-queue-storage";

export const TODO_LOCAL_STATE_CLEARED_EVENT = "todoster:todo-local-state-cleared";

export function clearTodoBrowserLocalState() {
  window.localStorage.removeItem(TODO_SNAPSHOT_STORAGE_KEY);
  window.localStorage.removeItem(TODO_TRASH_SNAPSHOT_STORAGE_KEY);
  window.localStorage.removeItem(TODO_SYNC_QUEUE_STORAGE_KEY);
  window.localStorage.removeItem(TODO_SESSION_MARKER_STORAGE_KEY);
  window.dispatchEvent(new Event(TODO_LOCAL_STATE_CLEARED_EVENT));
}
