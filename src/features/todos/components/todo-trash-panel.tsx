import type { TodoTrashSnapshot } from "@/lib/todos/types";

type TodoTrashPanelProps = {
  onPermanentlyDeleteTodoItem: (itemId: string) => void;
  onPermanentlyDeleteTodoList: (listId: string) => void;
  trash: TodoTrashSnapshot;
};

function formatDeletedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TodoTrashPanel({
  onPermanentlyDeleteTodoItem,
  onPermanentlyDeleteTodoList,
  trash,
}: TodoTrashPanelProps) {
  const isEmpty = trash.lists.length === 0 && trash.items.length === 0;

  return (
    <aside className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Trash
        </h2>
        <span className="text-sm font-medium text-zinc-500">
          {trash.lists.length + trash.items.length}
        </span>
      </div>

      {isEmpty ? (
        <p className="py-6 text-sm text-zinc-500">Trash is empty.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          <section>
            <h3 className="text-sm font-semibold text-zinc-900">
              Deleted lists
            </h3>
            {trash.lists.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No deleted lists.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {trash.lists.map((list) => (
                  <li
                    className="rounded-md border border-zinc-200 p-3"
                    key={list.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {list.title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Deleted {formatDeletedAt(list.deletedAt)}
                        </p>
                      </div>
                      <button
                        className="shrink-0 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        onClick={() => onPermanentlyDeleteTodoList(list.id)}
                        type="button"
                      >
                        Delete forever
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900">
              Deleted items
            </h3>
            {trash.items.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No deleted items.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {trash.items.map((item) => (
                  <li
                    className="rounded-md border border-zinc-200 p-3"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {item.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {item.listTitle}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Deleted {formatDeletedAt(item.deletedAt)}
                        </p>
                      </div>
                      <button
                        className="shrink-0 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        onClick={() => onPermanentlyDeleteTodoItem(item.id)}
                        type="button"
                      >
                        Delete forever
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </aside>
  );
}
