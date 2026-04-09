export type ToastType = "success" | "error";

type ToastProps = {
  open: boolean;
  message: string;
  type?: ToastType;
  onClose: () => void;
};

export default function Toast({
  open,
  message,
  type = "success",
  onClose,
}: ToastProps) {
  if (!open) return null;

  const tone =
    type === "error"
      ? "border-red-500/40 bg-red-50 text-red-900"
      : "border-emerald-500/40 bg-emerald-50 text-emerald-900";

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${tone}`}
      role="status"
    >
      <span className="flex-1 text-sm">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-white/90"
      >
        Fechar
      </button>
    </div>
  );
}
