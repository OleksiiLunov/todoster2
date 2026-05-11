"use client";

import type { FormEvent } from "react";

type CreateItemFormProps = {
  error: string;
  inputId: string;
  maxTitleLength: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (title: string) => void;
  title: string;
};

export function CreateItemForm({
  error,
  inputId,
  maxTitleLength,
  onSubmit,
  onTitleChange,
  title,
}: CreateItemFormProps) {
  return (
    <form
      className="mt-5 flex flex-col gap-2 border-t border-zinc-100 pt-4"
      onSubmit={onSubmit}
    >
      <label className="text-sm font-medium text-zinc-700" htmlFor={inputId}>
        New todo
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="h-10 min-w-0 flex-1 rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-900"
          id={inputId}
          maxLength={maxTitleLength}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Todo title"
          value={title}
        />
        <button
          className="h-10 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          type="submit"
        >
          Add todo
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

