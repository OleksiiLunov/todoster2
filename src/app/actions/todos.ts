"use server";

import { prisma } from "@/lib/prisma";
import { TEMP_USER_ID } from "@/lib/todos/types";

const MAX_TODO_TITLE_LENGTH = 120;

type PersistenceResult = {
  error?: string;
  ok: boolean;
};

type CreateTodoListInput = {
  id: string;
  position: number;
  title: string;
};

type CreateTodoItemInput = {
  id: string;
  listId: string;
  position: number;
  title: string;
};

type SetTodoDoneInput = {
  id: string;
  isDone: boolean;
};

type SetTodosDoneInput = {
  ids: string[];
  isDone: boolean;
  listId: string;
};

type SetTodoListTitleInput = {
  id: string;
  title: string;
};

type SetTodoItemTitleInput = {
  id: string;
  title: string;
};

type DeleteTodoListInput = {
  id: string;
};

type DeleteTodoItemInput = {
  id: string;
};

type PermanentlyDeleteTodoListInput = {
  id: string;
};

type PermanentlyDeleteTodoItemInput = {
  id: string;
};

type TodoPositionInput = {
  id: string;
  position: number;
};

type SetTodoListPositionsInput = {
  lists: TodoPositionInput[];
};

type SetTodoItemPositionsInput = {
  items: TodoPositionInput[];
  listId: string;
};

function validateId(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return `${label} is required.`;
  }

  if (value.length > 160) {
    return `${label} is too long.`;
  }

  return "";
}

function validatePosition(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return "Position must be a non-negative integer.";
  }

  return "";
}

function validatePositions(values: TodoPositionInput[], label: string) {
  if (!Array.isArray(values)) {
    return `${label} positions are required.`;
  }

  const ids = new Set<string>();

  for (const value of values) {
    const idError = validateId(value.id, label);
    if (idError) {
      return idError;
    }

    const positionError = validatePosition(value.position);
    if (positionError) {
      return positionError;
    }

    if (ids.has(value.id)) {
      return `${label} positions must not contain duplicates.`;
    }

    ids.add(value.id);
  }

  return "";
}

function validateIds(values: string[], label: string) {
  if (!Array.isArray(values) || values.length === 0) {
    return `${label} ids are required.`;
  }

  const ids = new Set<string>();

  for (const value of values) {
    const idError = validateId(value, label);
    if (idError) {
      return idError;
    }

    if (ids.has(value)) {
      return `${label} ids must not contain duplicates.`;
    }

    ids.add(value);
  }

  return "";
}

function validateTitle(value: unknown) {
  if (typeof value !== "string") {
    return { error: "Title is required.", title: "" };
  }

  const title = value.trim();

  if (title.length === 0) {
    return { error: "Title is required.", title: "" };
  }

  if (title.length > MAX_TODO_TITLE_LENGTH) {
    return {
      error: `Title must be ${MAX_TODO_TITLE_LENGTH} characters or fewer.`,
      title: "",
    };
  }

  return { error: "", title };
}

function validationError(error: string): PersistenceResult {
  return { error, ok: false };
}

function persistenceError(): PersistenceResult {
  return { error: "Could not save changes. Please try again.", ok: false };
}

export async function createTodoList(
  input: CreateTodoListInput,
): Promise<PersistenceResult> {
  const idError = validateId(input.id, "List id");
  if (idError) {
    return validationError(idError);
  }

  const titleValidation = validateTitle(input.title);
  if (titleValidation.error) {
    return validationError(titleValidation.error);
  }

  const positionError = validatePosition(input.position);
  if (positionError) {
    return validationError(positionError);
  }

  try {
    const existingList = await prisma.todoList.findUnique({
      select: { userId: true },
      where: { id: input.id },
    });

    if (existingList && existingList.userId !== TEMP_USER_ID) {
      return validationError("List was not found.");
    }

    await prisma.todoList.upsert({
      create: {
        id: input.id,
        deletedAt: null,
        position: input.position,
        title: titleValidation.title,
        userId: TEMP_USER_ID,
      },
      update: {
        deletedAt: null,
        position: input.position,
        title: titleValidation.title,
      },
      where: { id: input.id },
    });

    return { ok: true };
  } catch {
    return persistenceError();
  }
}

export async function createTodoItem(
  input: CreateTodoItemInput,
): Promise<PersistenceResult> {
  const idError = validateId(input.id, "Todo id");
  if (idError) {
    return validationError(idError);
  }

  const listIdError = validateId(input.listId, "List id");
  if (listIdError) {
    return validationError(listIdError);
  }

  const titleValidation = validateTitle(input.title);
  if (titleValidation.error) {
    return validationError(titleValidation.error);
  }

  const positionError = validatePosition(input.position);
  if (positionError) {
    return validationError(positionError);
  }

  try {
    const list = await prisma.todoList.findFirst({
      select: { id: true },
      where: {
        deletedAt: null,
        id: input.listId,
        userId: TEMP_USER_ID,
      },
    });

    if (!list) {
      return validationError("List was not found.");
    }

    const existingItem = await prisma.todoItem.findFirst({
      select: { id: true },
      where: {
        id: input.id,
        list: {
          userId: TEMP_USER_ID,
        },
      },
    });

    if (existingItem) {
      await prisma.todoItem.update({
        data: {
          deletedAt: null,
          listId: input.listId,
          position: input.position,
          title: titleValidation.title,
        },
        where: { id: input.id },
      });

      return { ok: true };
    }

    await prisma.todoItem.create({
      data: {
        id: input.id,
        deletedAt: null,
        listId: input.listId,
        position: input.position,
        title: titleValidation.title,
      },
    });

    return { ok: true };
  } catch {
    return persistenceError();
  }
}

export async function setTodoItemDone(
  input: SetTodoDoneInput,
): Promise<PersistenceResult> {
  const idError = validateId(input.id, "Todo id");
  if (idError) {
    return validationError(idError);
  }

  if (typeof input.isDone !== "boolean") {
    return validationError("Todo done state must be a boolean.");
  }

  try {
    const result = await prisma.todoItem.updateMany({
      data: {
        isDone: input.isDone,
      },
      where: {
        deletedAt: null,
        id: input.id,
        list: {
          deletedAt: null,
          userId: TEMP_USER_ID,
        },
      },
    });

    return result.count === 1
      ? { ok: true }
      : validationError("Todo was not found.");
  } catch {
    return persistenceError();
  }
}

export async function setTodoItemsDone(
  input: SetTodosDoneInput,
): Promise<PersistenceResult> {
  const listIdError = validateId(input.listId, "List id");
  if (listIdError) {
    return validationError(listIdError);
  }

  const idsError = validateIds(input.ids, "Todo");
  if (idsError) {
    return validationError(idsError);
  }

  if (typeof input.isDone !== "boolean") {
    return validationError("Todo done state must be a boolean.");
  }

  try {
    const result = await prisma.todoItem.updateMany({
      data: {
        isDone: input.isDone,
      },
      where: {
        id: {
          in: input.ids,
        },
        deletedAt: null,
        listId: input.listId,
        list: {
          deletedAt: null,
          userId: TEMP_USER_ID,
        },
      },
    });

    return result.count === input.ids.length
      ? { ok: true }
      : validationError("One or more todos were not found.");
  } catch {
    return persistenceError();
  }
}

export async function setTodoListTitle(
  input: SetTodoListTitleInput,
): Promise<PersistenceResult> {
  const idError = validateId(input.id, "List id");
  if (idError) {
    return validationError(idError);
  }

  const titleValidation = validateTitle(input.title);
  if (titleValidation.error) {
    return validationError(titleValidation.error);
  }

  try {
    const result = await prisma.todoList.updateMany({
      data: {
        title: titleValidation.title,
      },
      where: {
        deletedAt: null,
        id: input.id,
        userId: TEMP_USER_ID,
      },
    });

    return result.count === 1
      ? { ok: true }
      : validationError("List was not found.");
  } catch {
    return persistenceError();
  }
}

export async function setTodoItemTitle(
  input: SetTodoItemTitleInput,
): Promise<PersistenceResult> {
  const idError = validateId(input.id, "Todo id");
  if (idError) {
    return validationError(idError);
  }

  const titleValidation = validateTitle(input.title);
  if (titleValidation.error) {
    return validationError(titleValidation.error);
  }

  try {
    const result = await prisma.todoItem.updateMany({
      data: {
        title: titleValidation.title,
      },
      where: {
        deletedAt: null,
        id: input.id,
        list: {
          deletedAt: null,
          userId: TEMP_USER_ID,
        },
      },
    });

    return result.count === 1
      ? { ok: true }
      : validationError("Todo was not found.");
  } catch {
    return persistenceError();
  }
}

export async function deleteTodoList(
  input: DeleteTodoListInput,
): Promise<PersistenceResult> {
  const idError = validateId(input.id, "List id");
  if (idError) {
    return validationError(idError);
  }

  try {
    const deletedAt = new Date();

    await prisma.$transaction([
      prisma.todoList.updateMany({
        data: {
          deletedAt,
        },
        where: {
          deletedAt: null,
          id: input.id,
          userId: TEMP_USER_ID,
        },
      }),
      prisma.todoItem.updateMany({
        data: {
          deletedAt,
        },
        where: {
          deletedAt: null,
          listId: input.id,
          list: {
            userId: TEMP_USER_ID,
          },
        },
      }),
    ]);

    return { ok: true };
  } catch {
    return persistenceError();
  }
}

export async function deleteTodoItem(
  input: DeleteTodoItemInput,
): Promise<PersistenceResult> {
  const idError = validateId(input.id, "Todo id");
  if (idError) {
    return validationError(idError);
  }

  try {
    await prisma.todoItem.updateMany({
      data: {
        deletedAt: new Date(),
      },
      where: {
        deletedAt: null,
        id: input.id,
        list: {
          deletedAt: null,
          userId: TEMP_USER_ID,
        },
      },
    });

    return { ok: true };
  } catch {
    return persistenceError();
  }
}

export async function permanentlyDeleteTodoList(
  input: PermanentlyDeleteTodoListInput,
): Promise<PersistenceResult> {
  const idError = validateId(input.id, "List id");
  if (idError) {
    return validationError(idError);
  }

  try {
    await prisma.todoList.deleteMany({
      where: {
        deletedAt: {
          not: null,
        },
        id: input.id,
        userId: TEMP_USER_ID,
      },
    });

    return { ok: true };
  } catch {
    return persistenceError();
  }
}

export async function permanentlyDeleteTodoItem(
  input: PermanentlyDeleteTodoItemInput,
): Promise<PersistenceResult> {
  const idError = validateId(input.id, "Todo id");
  if (idError) {
    return validationError(idError);
  }

  try {
    await prisma.todoItem.deleteMany({
      where: {
        deletedAt: {
          not: null,
        },
        id: input.id,
        list: {
          userId: TEMP_USER_ID,
        },
      },
    });

    return { ok: true };
  } catch {
    return persistenceError();
  }
}

export async function setTodoListPositions(
  input: SetTodoListPositionsInput,
): Promise<PersistenceResult> {
  const positionsError = validatePositions(input.lists, "List");
  if (positionsError) {
    return validationError(positionsError);
  }

  try {
    await prisma.$transaction(
      input.lists.map((list) =>
        prisma.todoList.updateMany({
          data: {
            position: list.position,
          },
          where: {
            deletedAt: null,
            id: list.id,
            userId: TEMP_USER_ID,
          },
        }),
      ),
    );

    return { ok: true };
  } catch {
    return persistenceError();
  }
}

export async function setTodoItemPositions(
  input: SetTodoItemPositionsInput,
): Promise<PersistenceResult> {
  const listIdError = validateId(input.listId, "List id");
  if (listIdError) {
    return validationError(listIdError);
  }

  const positionsError = validatePositions(input.items, "Todo");
  if (positionsError) {
    return validationError(positionsError);
  }

  try {
    await prisma.$transaction(
      input.items.map((item) =>
        prisma.todoItem.updateMany({
          data: {
            position: item.position,
          },
          where: {
            id: item.id,
            deletedAt: null,
            listId: input.listId,
            list: {
              deletedAt: null,
              userId: TEMP_USER_ID,
            },
          },
        }),
      ),
    );

    return { ok: true };
  } catch {
    return persistenceError();
  }
}
