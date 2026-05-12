export const TEMP_USER_ID = "test-user";

export type TodoItemSnapshot = {
  id: string;
  title: string;
  position: number;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TodoListSnapshot = {
  id: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  items: TodoItemSnapshot[];
};

export type TodoSnapshot = {
  userId: string;
  bootstrappedAt: string;
  lists: TodoListSnapshot[];
};

export type TodoTrashItemSnapshot = TodoItemSnapshot & {
  deletedAt: string;
  listId: string;
  listTitle: string;
};

export type TodoTrashListSnapshot = Omit<TodoListSnapshot, "items"> & {
  deletedAt: string;
};

export type TodoTrashSnapshot = {
  userId: string;
  bootstrappedAt: string;
  lists: TodoTrashListSnapshot[];
  items: TodoTrashItemSnapshot[];
};

export type TodoBootstrap = {
  snapshot: TodoSnapshot;
  trash: TodoTrashSnapshot;
};
