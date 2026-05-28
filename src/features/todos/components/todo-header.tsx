import Image from "next/image";

type TodoHeaderProps = {
  listCount: number;
  todoCount: number;
};

export function TodoHeader({ listCount, todoCount }: TodoHeaderProps) {
  return (
    <header className="border-b border-[#e6dccb] pb-5">
      <div className="flex items-center gap-4 sm:gap-5">
        <Image
          alt="ToDoster"
          className="h-20 w-auto shrink-0 sm:h-24 md:h-28"
          height={782}
          priority
          src="/branding/logo-full.png"
          unoptimized
          width={825}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium uppercase tracking-wide text-[#7b694f]">
            Browser-first local state
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-[#6f604d]">
              Server data seeds startup. New lists and todos update the browser
              snapshot locally.
            </p>
            <dl className="grid shrink-0 grid-cols-2 gap-4 text-sm">
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
        </div>
      </div>
    </header>
  );
}
