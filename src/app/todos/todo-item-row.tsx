"use client";

import type { TodoItemSnapshot } from "@/lib/todos/types";

type TodoItemRowProps = {
  item: TodoItemSnapshot;
  onSetDone: (isDone: boolean) => void;
};

export function TodoItemRow({ item, onSetDone }: TodoItemRowProps) {
  return (
    <li className="flex items-start gap-3 py-3">
      <input
        aria-label={`Mark ${item.title} as ${item.isDone ? "not done" : "done"}`}
        checked={item.isDone}
        className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-950"
        onChange={(event) => onSetDone(event.target.checked)}
        type="checkbox"
      />
      <span
        className={`text-sm leading-6 ${
          item.isDone ? "text-zinc-500 line-through" : "text-zinc-800"
        }`}
      >
        {item.title}
      </span>
    </li>
  );
}
