type Props = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function Pagination({ page, totalPages, onPrev, onNext }: Props) {
  const tp = Number(totalPages);
  if (!Number.isFinite(tp) || tp <= 1) return null;

  const current = Number.isFinite(Number(page)) ? Number(page) : 0;
  const safePage = Math.min(Math.max(current, 0), tp - 1);

  const isFirst = safePage <= 0;
  const isLast = safePage >= tp - 1;

  function handlePrev() {
    if (isFirst) return;
    onPrev();
  }

  function handleNext() {
    if (isLast) return;
    onNext();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handlePrev}
        disabled={isFirst}
        className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Anterior
      </button>

      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs">
        Página <b className="font-semibold">{safePage + 1}</b> de{" "}
        <b className="font-semibold">{tp}</b>
      </span>

      <button
        onClick={handleNext}
        disabled={isLast}
        className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Próxima
      </button>
    </div>
  );
}


