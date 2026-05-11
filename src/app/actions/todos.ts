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
        position: input.position,
        title: titleValidation.title,
        userId: TEMP_USER_ID,
      },
      update: {
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
        id: input.id,
        list: {
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
        id: input.id,
        list: {
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
    await prisma.todoList.deleteMany({
      where: {
        id: input.id,
        userId: TEMP_USER_ID,
      },
    });

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
    await prisma.todoItem.deleteMany({
      where: {
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
