"use client";

import type { FormEvent } from "react";

type CreateListFormProps = {
  error: string;
  maxTitleLength: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (title: string) => void;
  title: string;
};

export function CreateListForm({
  error,
  maxTitleLength,
  onSubmit,
  onTitleChange,
  title,
}: CreateListFormProps) {
  return (
    <form
      className="mb-4 flex flex-col gap-3 border-b border-zinc-100 pb-4"
      onSubmit={onSubmit}
    >
      <div className="flex-1">
        <label
          className="text-sm font-medium text-zinc-700"
          htmlFor="new-list-title"
        >
          New list
        </label>
        <input
          className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-900"
          id="new-list-title"
          maxLength={maxTitleLength}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="List title"
          value={title}
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
      <button
        className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
        type="submit"
      >
        Add list
      </button>
    </form>
  );
}
