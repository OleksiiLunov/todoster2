import { prisma } from "@/lib/prisma";
import { TEMP_USER_ID, type TodoSnapshot } from "@/lib/todos/types";

export async function loadTodoBootstrap(): Promise<TodoSnapshot> {
  const lists = await prisma.todoList.findMany({
    where: {
      deletedAt: null,
      userId: TEMP_USER_ID,
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: {
      items: {
        where: {
          deletedAt: null,
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return {
    userId: TEMP_USER_ID,
    bootstrappedAt: new Date().toISOString(),
    lists: lists.map((list) => ({
      id: list.id,
      title: list.title,
      position: list.position,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
      items: list.items.map((item) => ({
        id: item.id,
        title: item.title,
        position: item.position,
        isDone: item.isDone,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    })),
  };
}
