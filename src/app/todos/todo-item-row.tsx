import type { TodoItemSnapshot } from "@/lib/todos/types";

type TodoItemRowProps = {
  item: TodoItemSnapshot;
};

export function TodoItemRow({ item }: TodoItemRowProps) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span
        aria-hidden="true"
        className={`mt-1 h-3 w-3 rounded-full border ${
          item.isDone
            ? "border-emerald-600 bg-emerald-600"
            : "border-zinc-300 bg-white"
        }`}
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

