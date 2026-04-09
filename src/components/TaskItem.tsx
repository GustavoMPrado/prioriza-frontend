import { useMemo, useState, type ChangeEvent } from "react";
import type {
  Atividade,
  PrioridadeAtividade,
  StatusAtividade,
} from "../api/taskApi";

const STATUS_OPTIONS: StatusAtividade[] = ["A_FAZER", "EM_ANDAMENTO", "CONCLUIDA"];
const PRIORITY_OPTIONS: PrioridadeAtividade[] = ["BAIXA", "MEDIA", "ALTA"];

type Props = {
  atividade: Atividade;
  onDelete: (id: number) => Promise<void> | void;
  onEdit: (atividade: Atividade) => void;
  onPatchStatus: (
    id: number,
    novoStatus: StatusAtividade
  ) => Promise<void> | void;
  onPatchPriority: (
    id: number,
    novaPrioridade: PrioridadeAtividade
  ) => Promise<void> | void;
  busy?: boolean;
};

function formatDateBR(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

function getStatusLabel(status: StatusAtividade): string {
  if (status === "A_FAZER") return "A fazer";
  if (status === "EM_ANDAMENTO") return "Em andamento";
  return "Concluída";
}

function getPriorityLabel(priority: PrioridadeAtividade): string {
  if (priority === "BAIXA") return "Baixa";
  if (priority === "MEDIA") return "Média";
  return "Alta";
}

export default function TaskItem({
  atividade,
  onDelete,
  onEdit,
  onPatchStatus,
  onPatchPriority,
  busy = false,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPatchingStatus, setIsPatchingStatus] = useState(false);
  const [isPatchingPriority, setIsPatchingPriority] = useState(false);

  const isBusy = busy || isDeleting || isPatchingStatus || isPatchingPriority;

  const statusLabel = getStatusLabel(atividade.status);
  const priorityLabel = getPriorityLabel(atividade.prioridade);
  const due = atividade.dataLimite ? formatDateBR(atividade.dataLimite) : null;

  const statusTone = useMemo(() => {
    if (atividade.status === "CONCLUIDA") {
      return {
        bg: "bg-emerald-400/15",
        bd: "border-emerald-400/40",
        text: "text-emerald-100",
      };
    }

    if (atividade.status === "EM_ANDAMENTO") {
      return {
        bg: "bg-sky-400/15",
        bd: "border-sky-400/40",
        text: "text-sky-100",
      };
    }

    return {
      bg: "bg-white/10",
      bd: "border-white/15",
      text: "text-zinc-100",
    };
  }, [atividade.status]);

  const priorityTone = useMemo(() => {
    if (atividade.prioridade === "ALTA") {
      return {
        bg: "bg-red-500/15",
        bd: "border-red-500/40",
        text: "text-red-100",
      };
    }

    if (atividade.prioridade === "MEDIA") {
      return {
        bg: "bg-amber-400/15",
        bd: "border-amber-400/40",
        text: "text-amber-100",
      };
    }

    return {
      bg: "bg-white/10",
      bd: "border-white/15",
      text: "text-zinc-100",
    };
  }, [atividade.prioridade]);

  async function handleDelete() {
    if (isBusy) return;

    const ok = window.confirm(`Excluir a atividade #${atividade.id}?`);
    if (!ok) return;

    try {
      setIsDeleting(true);
      await onDelete(atividade.id);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleEdit() {
    if (isBusy) return;
    onEdit(atividade);
  }

  async function handleStatusChange(e: ChangeEvent<HTMLSelectElement>) {
    if (isBusy) return;
    const novoStatus = e.target.value as StatusAtividade;

    try {
      setIsPatchingStatus(true);
      await onPatchStatus(atividade.id, novoStatus);
    } finally {
      setIsPatchingStatus(false);
    }
  }

  async function handlePriorityChange(e: ChangeEvent<HTMLSelectElement>) {
    if (isBusy) return;
    const novaPrioridade = e.target.value as PrioridadeAtividade;

    try {
      setIsPatchingPriority(true);
      await onPatchPriority(atividade.id, novaPrioridade);
    } finally {
      setIsPatchingPriority(false);
    }
  }

  return (
    <li
      className={`flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] backdrop-blur ${
        isBusy ? "opacity-85" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <div className="truncate text-base font-extrabold tracking-tight">
            {atividade.titulo}
          </div>

          {due ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">
              Vence: {due}
            </span>
          ) : null}
        </div>

        {atividade.descricao ? (
          <div className="mt-2 text-sm leading-snug opacity-90">
            {atividade.descricao}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${statusTone.bg} ${statusTone.bd} ${statusTone.text}`}
          >
            Status: <b className="font-semibold">{statusLabel}</b>
          </span>

          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${priorityTone.bg} ${priorityTone.bd} ${priorityTone.text}`}
          >
            Prioridade: <b className="font-semibold">{priorityLabel}</b>
          </span>

          <label className="flex items-center gap-2">
            <span className="text-sm opacity-85">Alterar status</span>
            <select
              value={atividade.status}
              onChange={handleStatusChange}
              disabled={isBusy}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status} className="text-zinc-900">
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-sm opacity-85">Alterar prioridade</span>
            <select
              value={atividade.prioridade}
              onChange={handlePriorityChange}
              disabled={isBusy}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {PRIORITY_OPTIONS.map((prioridade) => (
                <option
                  key={prioridade}
                  value={prioridade}
                  className="text-zinc-900"
                >
                  {getPriorityLabel(prioridade)}
                </option>
              ))}
            </select>
          </label>

          {isPatchingStatus || isPatchingPriority ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">
              Salvando...
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <button
          onClick={handleEdit}
          disabled={isBusy}
          className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Editar
        </button>

        <button
          onClick={handleDelete}
          disabled={isBusy}
          className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    </li>
  );
}










