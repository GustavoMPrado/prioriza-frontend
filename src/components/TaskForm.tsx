import { useEffect, useMemo, useState } from "react";
import type {
  Atividade,
  AtualizarAtividadePayload,
  CriarAtividadePayload,
  PrioridadeAtividade,
  StatusAtividade,
} from "../api/taskApi";

type TaskFormProps = {
  onCreate: (payload: CriarAtividadePayload) => Promise<void> | void;
  onUpdate: (id: number, payload: AtualizarAtividadePayload) => Promise<void> | void;
  atividadeEmEdicao: Atividade | null;
  onCancelEdit?: () => void;
  setError?: (msg: string) => void;
  busy?: boolean;
};

const STATUS_OPTIONS: StatusAtividade[] = ["A_FAZER", "EM_ANDAMENTO", "CONCLUIDA"];
const PRIORITY_OPTIONS: PrioridadeAtividade[] = ["BAIXA", "MEDIA", "ALTA"];

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

export default function TaskForm({
  onCreate,
  onUpdate,
  atividadeEmEdicao,
  onCancelEdit,
  setError,
  busy = false,
}: TaskFormProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<StatusAtividade>("A_FAZER");
  const [prioridade, setPrioridade] = useState<PrioridadeAtividade>("BAIXA");
  const [dataLimite, setDataLimite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = !!atividadeEmEdicao;
  const disabled = submitting || busy;

  const inputClass = useMemo(
    () =>
      "w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/50 disabled:cursor-not-allowed disabled:opacity-60",
    []
  );

  const selectClass = useMemo(
    () =>
      "w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60",
    []
  );

  function resetForm() {
    setTitulo("");
    setDescricao("");
    setStatus("A_FAZER");
    setPrioridade("BAIXA");
    setDataLimite("");
  }

  useEffect(() => {
    if (!atividadeEmEdicao) {
      resetForm();
      return;
    }

    setTitulo(atividadeEmEdicao.titulo ?? "");
    setDescricao(atividadeEmEdicao.descricao ?? "");
    setStatus(atividadeEmEdicao.status ?? "A_FAZER");
    setPrioridade(atividadeEmEdicao.prioridade ?? "BAIXA");
    setDataLimite(
      atividadeEmEdicao.dataLimite ? atividadeEmEdicao.dataLimite.slice(0, 10) : ""
    );
  }, [atividadeEmEdicao]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled) return;

    if (!titulo.trim()) {
      setError?.("Título é obrigatório.");
      return;
    }

    const payload: CriarAtividadePayload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      status,
      prioridade,
      dataLimite: dataLimite || null,
    };

    try {
      setError?.("");
      setSubmitting(true);

      if (isEditMode && atividadeEmEdicao) {
        const updatePayload: AtualizarAtividadePayload = payload;
        await onUpdate(atividadeEmEdicao.id, updatePayload);
      } else {
        await onCreate(payload);
        resetForm();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (disabled) return;
    setError?.("");
    onCancelEdit?.();
    resetForm();
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold tracking-tight">
          {isEditMode && atividadeEmEdicao
            ? `Editando atividade #${atividadeEmEdicao.id}`
            : "Nova atividade"}
        </h2>

        {isEditMode ? (
          <span
            className={`rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs ${
              disabled ? "opacity-70" : ""
            }`}
          >
            Modo edição
          </span>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`mt-3 grid gap-3 ${disabled ? "opacity-90" : ""}`}
      >
        <div className="grid gap-2">
          <label className="text-xs font-medium opacity-90">Título</label>
          <input
            placeholder="Ex: Pagar contas"
            value={titulo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setTitulo(e.target.value);
            }}
            className={inputClass}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium opacity-90">Descrição</label>
          <textarea
            placeholder="Detalhes (opcional)"
            value={descricao}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setDescricao(e.target.value);
            }}
            rows={3}
            className={`${inputClass} resize-y`}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-xs font-medium opacity-90">Status</label>
            <select
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatus(e.target.value as StatusAtividade)
              }
              disabled={disabled}
              className={selectClass}
            >
              {STATUS_OPTIONS.map((statusOption) => (
                <option
                  key={statusOption}
                  value={statusOption}
                  className="text-zinc-900"
                >
                  {getStatusLabel(statusOption)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-medium opacity-90">Prioridade</label>
            <select
              value={prioridade}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPrioridade(e.target.value as PrioridadeAtividade)
              }
              disabled={disabled}
              className={selectClass}
            >
              {PRIORITY_OPTIONS.map((priorityOption) => (
                <option
                  key={priorityOption}
                  value={priorityOption}
                  className="text-zinc-900"
                >
                  {getPriorityLabel(priorityOption)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-medium opacity-90">Vencimento</label>
            <input
              type="date"
              value={dataLimite}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDataLimite(e.target.value)
              }
              disabled={disabled}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={disabled}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {disabled
              ? isEditMode
                ? "Salvando..."
                : "Criando..."
              : isEditMode
                ? "Salvar alterações"
                : "Criar atividade"}
          </button>

          {isEditMode ? (
            <button
              type="button"
              onClick={handleCancel}
              disabled={disabled}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </>
  );
}








