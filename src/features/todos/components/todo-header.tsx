type TodoHeaderProps = {
  listCount: number;
  todoCount: number;
};

export function TodoHeader({ listCount, todoCount }: TodoHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-zinc-200 pb-6">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Browser-first local state
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-950">ToDoster</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Server data seeds startup. New lists and todos update the browser
            snapshot locally.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-zinc-500">Lists</dt>
            <dd className="font-semibold text-zinc-950">{listCount}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Todos</dt>
            <dd className="font-semibold text-zinc-950">{todoCount}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}

