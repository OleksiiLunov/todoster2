import { prisma } from "@/lib/prisma";
import { TEMP_USER_ID, type TodoBootstrap } from "@/lib/todos/types";

export async function loadTodoBootstrap(): Promise<TodoBootstrap> {
  const bootstrappedAt = new Date().toISOString();
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
  const trashLists = await prisma.todoList.findMany({
    where: {
      deletedAt: {
        not: null,
      },
      userId: TEMP_USER_ID,
    },
    orderBy: [{ deletedAt: "desc" }, { createdAt: "asc" }],
  });
  const trashItems = await prisma.todoItem.findMany({
    where: {
      deletedAt: {
        not: null,
      },
      list: {
        userId: TEMP_USER_ID,
      },
    },
    orderBy: [{ deletedAt: "desc" }, { createdAt: "asc" }],
    include: {
      list: {
        select: {
          title: true,
        },
      },
    },
  });

  return {
    snapshot: {
      userId: TEMP_USER_ID,
      bootstrappedAt,
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
    },
    trash: {
      userId: TEMP_USER_ID,
      bootstrappedAt,
      lists: trashLists.map((list) => ({
        id: list.id,
        title: list.title,
        position: list.position,
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString(),
        deletedAt: list.deletedAt?.toISOString() ?? bootstrappedAt,
      })),
      items: trashItems.map((item) => ({
        id: item.id,
        listId: item.listId,
        listTitle: item.list.title,
        title: item.title,
        position: item.position,
        isDone: item.isDone,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        deletedAt: item.deletedAt?.toISOString() ?? bootstrappedAt,
      })),
    },
  };
}
