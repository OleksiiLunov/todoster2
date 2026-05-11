import type { TodoItemSnapshot, TodoListSnapshot, TodoSnapshot } from "@/lib/todos/types";

type MoveDirection = "down" | "up";

type CreateTodoListInput = {
  id: string;
  now: string;
  position: number;
  title: string;
};

type CreateTodoItemInput = {
  id: string;
  listId: string;
  now: string;
  position: number;
  title: string;
};

type SetTodoItemDoneInput = {
  isDone: boolean;
  itemId: string;
  listId: string;
  now: string;
};

type SetTodoListTitleInput = {
  listId: string;
  now: string;
  title: string;
};

type SetTodoItemTitleInput = {
  itemId: string;
  listId: string;
  now: string;
  title: string;
};

type DeleteTodoListInput = {
  listId: string;
};

type DeleteTodoItemInput = {
  itemId: string;
  listId: string;
  now: string;
};

type ReorderTodoListsInput = {
  direction: MoveDirection;
  listId: string;
};

type ReorderTodoItemsInput = {
  direction: MoveDirection;
  itemId: string;
  listId: string;
  now: string;
};

function moveArrayItem<T extends object>(
  items: T[],
  fromIndex: number,
  toIndex: number,
) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (!movedItem) {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

function normalizePositions<T extends { position: number }>(items: T[]) {
  return items.map((item, position) => ({
    ...item,
    position,
  }));
}

export function createTodoListSnapshot(
  snapshot: TodoSnapshot,
  input: CreateTodoListInput,
): TodoSnapshot {
  return {
    ...snapshot,
    lists: [
      ...snapshot.lists,
      {
        id: input.id,
        title: input.title,
        position: input.position,
        createdAt: input.now,
        updatedAt: input.now,
        items: [],
      },
    ],
  };
}

export function createTodoItemSnapshot(
  snapshot: TodoSnapshot,
  input: CreateTodoItemInput,
): TodoSnapshot {
  return {
    ...snapshot,
    lists: snapshot.lists.map((list) =>
      list.id === input.listId
        ? {
            ...list,
            updatedAt: input.now,
            items: [
              ...list.items,
              {
                id: input.id,
                title: input.title,
                position: input.position,
                isDone: false,
                createdAt: input.now,
                updatedAt: input.now,
              },
            ],
          }
        : list,
    ),
  };
}

export function setTodoItemDoneSnapshot(
  snapshot: TodoSnapshot,
  input: SetTodoItemDoneInput,
): TodoSnapshot {
  return {
    ...snapshot,
    lists: snapshot.lists.map((list) =>
      list.id === input.listId
        ? {
            ...list,
            updatedAt: input.now,
            items: list.items.map((item) =>
              item.id === input.itemId
                ? {
                    ...item,
                    isDone: input.isDone,
                    updatedAt: input.now,
                  }
                : item,
            ),
          }
        : list,
    ),
  };
}

export function setTodoListTitleSnapshot(
  snapshot: TodoSnapshot,
  input: SetTodoListTitleInput,
): TodoSnapshot {
  return {
    ...snapshot,
    lists: snapshot.lists.map((list) =>
      list.id === input.listId
        ? {
            ...list,
            title: input.title,
            updatedAt: input.now,
          }
        : list,
    ),
  };
}

export function setTodoItemTitleSnapshot(
  snapshot: TodoSnapshot,
  input: SetTodoItemTitleInput,
): TodoSnapshot {
  return {
    ...snapshot,
    lists: snapshot.lists.map((list) =>
      list.id === input.listId
        ? {
            ...list,
            updatedAt: input.now,
            items: list.items.map((item) =>
              item.id === input.itemId
                ? {
                    ...item,
                    title: input.title,
                    updatedAt: input.now,
                  }
                : item,
            ),
          }
        : list,
    ),
  };
}

export function deleteTodoListSnapshot(
  snapshot: TodoSnapshot,
  input: DeleteTodoListInput,
): TodoSnapshot {
  return {
    ...snapshot,
    lists: snapshot.lists.filter((list) => list.id !== input.listId),
  };
}

export function deleteTodoItemSnapshot(
  snapshot: TodoSnapshot,
  input: DeleteTodoItemInput,
): TodoSnapshot {
  return {
    ...snapshot,
    lists: snapshot.lists.map((list) =>
      list.id === input.listId
        ? {
            ...list,
            updatedAt: input.now,
            items: list.items.filter((item) => item.id !== input.itemId),
          }
        : list,
    ),
  };
}

export function reorderTodoListsSnapshot(
  snapshot: TodoSnapshot,
  input: ReorderTodoListsInput,
): TodoSnapshot {
  const currentIndex = snapshot.lists.findIndex(
    (list) => list.id === input.listId,
  );

  if (currentIndex === -1) {
    return snapshot;
  }

  const nextIndex = input.direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= snapshot.lists.length) {
    return snapshot;
  }

  return {
    ...snapshot,
    lists: normalizePositions(
      moveArrayItem<TodoListSnapshot>(snapshot.lists, currentIndex, nextIndex),
    ),
  };
}

export function reorderTodoItemsSnapshot(
  snapshot: TodoSnapshot,
  input: ReorderTodoItemsInput,
): TodoSnapshot {
  const targetList = snapshot.lists.find((list) => list.id === input.listId);
  const currentIndex =
    targetList?.items.findIndex((item) => item.id === input.itemId) ?? -1;

  if (!targetList || currentIndex === -1) {
    return snapshot;
  }

  const nextIndex = input.direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= targetList.items.length) {
    return snapshot;
  }

  const items = normalizePositions(
    moveArrayItem<TodoItemSnapshot>(targetList.items, currentIndex, nextIndex),
  );

  return {
    ...snapshot,
    lists: snapshot.lists.map((list) =>
      list.id === input.listId
        ? {
            ...list,
            updatedAt: input.now,
            items,
          }
        : list,
    ),
  };
}
