import Image from "next/image";

type TodoHeaderProps = {
  listCount: number;
  todoCount: number;
};

export function TodoHeader({ listCount, todoCount }: TodoHeaderProps) {
  return (
    <header className="w-full flex-1 border-b border-[#e6dccb] pb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <Image
            alt="ToDoster"
            className="h-20 w-auto shrink-0 sm:h-24 md:h-28"
            height={782}
            priority
            src="/branding/logo-full.png"
            unoptimized
            width={825}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-wide text-[#7b694f]">
              A calm place for your daily tasks
            </p>
            <p className="max-w-2xl text-sm leading-6 text-[#6f604d]">
              Stay organized. Focus on what matters.
            </p>
          </div>
        </div>
        <dl className="grid shrink-0 grid-cols-2 gap-6 text-sm sm:ml-auto">
          <div>
            <dt className="text-[#7b694f]">Lists</dt>
            <dd className="font-semibold text-[#173f2a]">{listCount}</dd>
          </div>
          <div>
            <dt className="text-[#7b694f]">Todos</dt>
            <dd className="font-semibold text-[#173f2a]">{todoCount}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
