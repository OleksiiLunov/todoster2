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

