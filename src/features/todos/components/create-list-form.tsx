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
      className="mb-4 flex flex-col gap-3 border-b border-[#efe5d2] pb-4"
      onSubmit={onSubmit}
    >
      <div className="flex-1">
        <label
          className="text-sm font-medium text-[#4d3a22]"
          htmlFor="new-list-title"
        >
          New list
        </label>
        <input
          className="mt-2 h-11 w-full rounded-md border border-[#d7c8b3] bg-white px-3 text-sm text-[#173f2a] outline-none transition focus:border-[#173f2a]"
          id="new-list-title"
          maxLength={maxTitleLength}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="List title"
          value={title}
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
      <button
        className="h-11 rounded-md bg-[#173f2a] px-4 text-sm font-medium text-white transition hover:bg-[#225a3d]"
        type="submit"
      >
        Add list
      </button>
    </form>
  );
}
