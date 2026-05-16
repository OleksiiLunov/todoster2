import { prisma } from "@/lib/prisma";
import {TodoBootstrap} from "@/lib/todos/types";
import { getServerUser } from "@/lib/auth/server-user";

export async function loadTodoBootstrap(): Promise<TodoBootstrap> {
  const bootstrappedAt = new Date().toISOString();
  const user = await getServerUser();
  if (!user) {
    return {
      snapshot: {
        userId: "",
        bootstrappedAt,
        lists: [],
      },
      trash: {
        userId: "",
        bootstrappedAt,
        lists: [],
        items: [],
      }
    }
  }
  const lists = await prisma.todoList.findMany({
    where: {
      deletedAt: null,
      userId: user.id,
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
      userId: user.id,
    },
    orderBy: [{ deletedAt: "desc" }, { createdAt: "asc" }],
  });
  const trashItems = await prisma.todoItem.findMany({
    where: {
      deletedAt: {
        not: null,
      },
      list: {
        userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
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
