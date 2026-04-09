type BusyOverlayProps = {
  open: boolean;
  label?: string;
};

export default function BusyOverlay({
  open,
  label = "Processando...",
}: BusyOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 backdrop-blur-sm">
      <div className="min-w-[220px] rounded-2xl border border-white/15 bg-black/40 p-4 text-center shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
        <div className="mx-auto mb-2 h-7 w-7 animate-spin rounded-full border-4 border-white/25 border-t-white/90" />
        <div className="text-xs opacity-90">{label}</div>
      </div>
    </div>
  );
}


