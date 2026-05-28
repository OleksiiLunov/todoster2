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
      className="mt-5 flex flex-col gap-2 border-t border-[#efe5d2] pt-4"
      onSubmit={onSubmit}
    >
      <label className="text-sm font-medium text-[#4d3a22]" htmlFor={inputId}>
        New todo
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="h-10 min-w-0 flex-1 rounded-md border border-[#d7c8b3] bg-white px-3 text-sm text-[#173f2a] outline-none transition focus:border-[#173f2a]"
          id={inputId}
          maxLength={maxTitleLength}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Todo title"
          value={title}
        />
        <button
          className="h-10 rounded-md bg-[#173f2a] px-3 text-sm font-medium text-white transition hover:bg-[#225a3d]"
          type="submit"
        >
          Add todo
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
