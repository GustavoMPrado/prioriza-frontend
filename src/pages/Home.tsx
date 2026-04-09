import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  atualizarAtividade,
  atualizarParcialmenteAtividade,
  criarAtividade,
  excluirAtividade,
  fazerLogin,
  listarAtividades,
  obterTokenAutenticacao,
} from "../api/taskApi";
import type {
  Atividade,
  AtualizarAtividadePayload,
  CriarAtividadePayload,
  PrioridadeAtividade,
  StatusAtividade,
} from "../api/taskApi";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import Toast from "../components/Toast";
import BusyOverlay from "../components/BusyOverlay";

type TipoToast = "success" | "error";

type CorpoErroApi = {
  message?: string;
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as unknown;

    if (typeof data === "string" && data.trim()) return data;

    if (data && typeof data === "object") {
      const maybe = (data as CorpoErroApi).message;
      if (typeof maybe === "string" && maybe.trim()) return maybe;
    }

    const status = err.response?.status;
    if (status) return `${fallback} (HTTP ${status})`;
  }

  if (err instanceof Error && err.message.trim()) return err.message;

  return fallback;
}

function isHttp401(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

export default function Home() {
  const [token, setToken] = useState<string | null>(() => obterTokenAutenticacao());

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fazendoLogin, setFazendoLogin] = useState(false);
  const [erroLogin, setErroLogin] = useState("");

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [atividadeEmEdicao, setAtividadeEmEdicao] = useState<Atividade | null>(null);

  const [carregandoLista, setCarregandoLista] = useState(false);
  const [erro, setErro] = useState("");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [sort, setSort] = useState("id,desc");
  const [busy, setBusy] = useState(false);

  const [buscaInput, setBuscaInput] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusAtividade | "">("");
  const [prioridadeFilter, setPrioridadeFilter] = useState<PrioridadeAtividade | "">("");

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    type: TipoToast;
  }>({
    open: false,
    message: "",
    type: "success",
  });

  const toastTimerRef = useRef<number | null>(null);

  function showToast(message: string, type: TipoToast = "success") {
    setToast({ open: true, message, type });

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToast((t) => ({ ...t, open: false }));
    }, 3000);
  }

  function closeToast() {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast((t) => ({ ...t, open: false }));
  }

  function atualizarTokenPeloStorage() {
    const tokenAtual = obterTokenAutenticacao();
    setToken(tokenAtual);
    return tokenAtual;
  }

  async function carregarAtividades(customPage = page) {
    const tokenAtual = atualizarTokenPeloStorage();
    if (!tokenAtual) return;

    try {
      setErro("");
      setCarregandoLista(true);

      const data = await listarAtividades({
        page: customPage,
        size,
        sort,
        q: buscaAplicada.trim() ? buscaAplicada.trim() : undefined,
        status: statusFilter || undefined,
        prioridade: prioridadeFilter || undefined,
      });

      const itens = data.content ?? [];
      setAtividades(itens);

      const totalPaginas = Number(data?.page?.totalPages ?? data?.totalPages ?? 0);
      setTotalPages(totalPaginas);
      setPage(Number(data?.page?.number ?? customPage));

      const totalItens = Number(data?.page?.totalElements ?? data?.totalElements ?? 0);
      setTotalElements(totalItens);
    } catch (err: unknown) {
      if (isHttp401(err)) {
        atualizarTokenPeloStorage();
        setAtividades([]);
        setAtividadeEmEdicao(null);
        setErro("");
        setErroLogin("Sessão expirada. Entre novamente.");
        showToast("Sessão expirada. Faça login novamente.", "error");
        return;
      }

      const msg = getErrorMessage(
        err,
        "Falha ao buscar atividades (GET /atividades)."
      );
      setErro(msg);
      showToast(msg, "error");
      console.error(err);
    } finally {
      setCarregandoLista(false);
    }
  }

  useEffect(() => {
    const tokenAtual = atualizarTokenPeloStorage();
    if (!tokenAtual) return;
    carregarAtividades(page);
  }, [token, page, size, sort, buscaAplicada, statusFilter, prioridadeFilter]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  async function handleLogin() {
    try {
      setFazendoLogin(true);
      setErroLogin("");
      setErro("");

      const res = await fazerLogin({
        username: username.trim(),
        password,
      });

      if (!res?.token) {
        setErroLogin("Falha no login: token não recebido.");
        showToast("Falha no login: token não recebido.", "error");
        return;
      }

      const tokenAtual = atualizarTokenPeloStorage();

      setPage(0);
      setBuscaInput("");
      setBuscaAplicada("");
      setStatusFilter("");
      setPrioridadeFilter("");
      setAtividadeEmEdicao(null);
      setAtividades([]);
      setTotalPages(0);
      setTotalElements(0);

      if (tokenAtual) {
        await carregarAtividades(0);
      }

      showToast("Login realizado!");
    } catch (err: unknown) {
      if (isHttp401(err)) {
        setErroLogin("Usuário ou senha inválidos.");
        showToast("Usuário ou senha inválidos.", "error");
        return;
      }

      const msg = getErrorMessage(
        err,
        "Falha ao fazer login (POST /autenticacao/login)."
      );
      setErroLogin(msg);
      showToast(msg, "error");
      console.error(err);
    } finally {
      setFazendoLogin(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("prioriza_token");
    setToken(null);
    setUsername("");
    setPassword("");
    setAtividades([]);
    setAtividadeEmEdicao(null);
    setErro("");
    setErroLogin("");
    setPage(0);
    setTotalPages(0);
    setTotalElements(0);
    setBuscaInput("");
    setBuscaAplicada("");
    setStatusFilter("");
    setPrioridadeFilter("");
    showToast("Você saiu.");
  }

  async function handleCreate(payload: CriarAtividadePayload) {
    try {
      if (!atualizarTokenPeloStorage()) return;

      setBusy(true);
      setErro("");

      await criarAtividade(payload);
      setAtividadeEmEdicao(null);
      setPage(0);
      await carregarAtividades(0);
      showToast("Atividade criada com sucesso!");
    } catch (err: unknown) {
      if (isHttp401(err)) {
        atualizarTokenPeloStorage();
        setAtividades([]);
        setAtividadeEmEdicao(null);
        setErro("");
        setErroLogin("Sessão expirada. Entre novamente.");
        showToast("Sessão expirada. Faça login novamente.", "error");
        return;
      }

      const msg = getErrorMessage(
        err,
        "Falha ao criar atividade (POST /atividades)."
      );
      setErro(msg);
      showToast(msg, "error");
      console.error(err);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(id: number, payload: AtualizarAtividadePayload) {
    try {
      if (!atualizarTokenPeloStorage()) return;

      setBusy(true);
      setErro("");
      await atualizarAtividade(id, payload);
      setAtividadeEmEdicao(null);
      await carregarAtividades(page);
      showToast("Alterações salvas!");
    } catch (err: unknown) {
      if (isHttp401(err)) {
        atualizarTokenPeloStorage();
        setAtividades([]);
        setAtividadeEmEdicao(null);
        setErro("");
        setErroLogin("Sessão expirada. Entre novamente.");
        showToast("Sessão expirada. Faça login novamente.", "error");
        return;
      }

      const msg = getErrorMessage(
        err,
        "Falha ao atualizar atividade (PUT /atividades/{id})."
      );
      setErro(msg);
      showToast(msg, "error");
      console.error(err);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      if (!atualizarTokenPeloStorage()) return;

      setBusy(true);
      setErro("");
      await excluirAtividade(id);

      if (atividadeEmEdicao?.id === id) {
        setAtividadeEmEdicao(null);
      }

      const restantes = atividades.length - 1;
      const deveVoltarPagina = restantes <= 0 && page > 0;

      if (deveVoltarPagina) {
        setPage((p) => Math.max(0, p - 1));
      } else {
        await carregarAtividades(page);
      }

      showToast("Atividade excluída.");
    } catch (err: unknown) {
      if (isHttp401(err)) {
        atualizarTokenPeloStorage();
        setAtividades([]);
        setAtividadeEmEdicao(null);
        setErro("");
        setErroLogin("Sessão expirada. Entre novamente.");
        showToast("Sessão expirada. Faça login novamente.", "error");
        return;
      }

      const msg = getErrorMessage(
        err,
        "Falha ao excluir atividade (DELETE /atividades/{id})."
      );
      setErro(msg);
      showToast(msg, "error");
      console.error(err);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handlePatchStatus(id: number, novoStatus: StatusAtividade) {
    const atividadeAnterior = atividades.find((atividade) => atividade.id === id);
    if (!atividadeAnterior || atividadeAnterior.status === novoStatus || busy) return;

    try {
      if (!atualizarTokenPeloStorage()) return;

      setBusy(true);
      setErro("");

      setAtividades((prev) =>
        prev.map((atividade) =>
          atividade.id === id ? { ...atividade, status: novoStatus } : atividade
        )
      );

      await atualizarParcialmenteAtividade(id, { status: novoStatus });
      showToast("Status atualizado.");
    } catch (err: unknown) {
      setAtividades((prev) =>
        prev.map((atividade) =>
          atividade.id === id
            ? { ...atividade, status: atividadeAnterior.status }
            : atividade
        )
      );

      if (isHttp401(err)) {
        atualizarTokenPeloStorage();
        setAtividades([]);
        setAtividadeEmEdicao(null);
        setErro("");
        setErroLogin("Sessão expirada. Entre novamente.");
        showToast("Sessão expirada. Faça login novamente.", "error");
        return;
      }

      const msg = getErrorMessage(
        err,
        "Falha ao atualizar status (PATCH /atividades/{id})."
      );
      setErro(msg);
      showToast(msg, "error");
      console.error(err);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handlePatchPriority(
    id: number,
    novaPrioridade: PrioridadeAtividade
  ) {
    const atividadeAnterior = atividades.find((atividade) => atividade.id === id);
    if (
      !atividadeAnterior ||
      atividadeAnterior.prioridade === novaPrioridade ||
      busy
    ) {
      return;
    }

    try {
      if (!atualizarTokenPeloStorage()) return;

      setBusy(true);
      setErro("");

      setAtividades((prev) =>
        prev.map((atividade) =>
          atividade.id === id
            ? { ...atividade, prioridade: novaPrioridade }
            : atividade
        )
      );

      await atualizarParcialmenteAtividade(id, {
        prioridade: novaPrioridade,
      });

      showToast("Prioridade atualizada.");
    } catch (err: unknown) {
      setAtividades((prev) =>
        prev.map((atividade) =>
          atividade.id === id
            ? { ...atividade, prioridade: atividadeAnterior.prioridade }
            : atividade
        )
      );

      if (isHttp401(err)) {
        atualizarTokenPeloStorage();
        setAtividades([]);
        setAtividadeEmEdicao(null);
        setErro("");
        setErroLogin("Sessão expirada. Entre novamente.");
        showToast("Sessão expirada. Faça login novamente.", "error");
        return;
      }

      const msg = getErrorMessage(
        err,
        "Falha ao atualizar prioridade (PATCH /atividades/{id})."
      );
      setErro(msg);
      showToast(msg, "error");
      console.error(err);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  function handleEdit(atividade: Atividade) {
    if (busy) return;

    setErro("");
    setAtividadeEmEdicao({
      ...atividade,
      descricao: atividade.descricao ?? null,
      dataLimite: atividade.dataLimite ?? null,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setAtividadeEmEdicao(null);
  }

  function goPrev() {
    if (busy) return;
    setPage((p) => Math.max(0, p - 1));
  }

  function goNext() {
    if (busy) return;
    if (!totalPages || totalPages <= 1) return;
    setPage((p) => Math.min(totalPages - 1, p + 1));
  }

  function handleChangeSize(e: React.ChangeEvent<HTMLSelectElement>) {
    if (busy) return;
    setSize(Number(e.target.value));
    setPage(0);
  }

  function handleChangeSort(e: React.ChangeEvent<HTMLSelectElement>) {
    if (busy) return;
    setSort(e.target.value);
    setPage(0);
  }

  function applySearch() {
    if (busy) return;
    setPage(0);
    setBuscaAplicada(buscaInput);
  }

  function clearFilters() {
    if (busy) return;
    setBuscaInput("");
    setBuscaAplicada("");
    setStatusFilter("");
    setPrioridadeFilter("");
    setPage(0);
  }

  const hasFilters = useMemo(() => {
    return (
      buscaAplicada.trim() !== "" ||
      statusFilter !== "" ||
      prioridadeFilter !== ""
    );
  }, [buscaAplicada, statusFilter, prioridadeFilter]);

  const stats = useMemo(() => {
    const total = atividades.length;
    const aFazer = atividades.filter((atividade) => atividade.status === "A_FAZER").length;
    const emAndamento = atividades.filter(
      (atividade) => atividade.status === "EM_ANDAMENTO"
    ).length;
    const concluidas = atividades.filter(
      (atividade) => atividade.status === "CONCLUIDA"
    ).length;

    return { total, aFazer, emAndamento, concluidas };
  }, [atividades]);

  const isLoggedIn = !!token;

  if (!isLoggedIn) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
        <Toast
          open={toast.open}
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur">
          <h1 className="m-0 text-3xl font-semibold tracking-tight md:text-4xl">
            Prioriza — Login
          </h1>

          <p className="mt-2 text-sm opacity-80">
            Entre para acessar suas atividades.
          </p>

          {erroLogin && (
            <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm">
              {erroLogin}
            </div>
          )}

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm opacity-85">Usuário</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/50"
                placeholder="username"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm opacity-85">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/50"
                placeholder="password"
              />
            </label>

            <button
              type="button"
              onClick={handleLogin}
              disabled={fazendoLogin || !username.trim() || !password}
              className={`mt-2 rounded-xl border border-white/15 px-4 py-2 text-sm ${
                fazendoLogin || !username.trim() || !password
                  ? "cursor-not-allowed opacity-50"
                  : "bg-white/10 hover:bg-white/15"
              }`}
            >
              {fazendoLogin ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <BusyOverlay
        open={busy || carregandoLista}
        label={busy ? "Processando..." : "Carregando..."}
      />
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />

      <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-black/20 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="m-0 text-4xl font-semibold tracking-tight md:text-5xl">
            Prioriza
          </h1>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={busy || carregandoLista}
              className={`rounded-full border border-white/15 px-3 py-2 text-xs ${
                busy || carregandoLista
                  ? "cursor-not-allowed opacity-50"
                  : "bg-white/10 hover:bg-white/15"
              }`}
            >
              Sair
            </button>

            <span className="inline-flex min-h-[34px] items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs">
              Total (página): <b>{stats.total}</b>
            </span>
            <span className="inline-flex min-h-[34px] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs">
              A fazer: <b>{stats.aFazer}</b>
            </span>
            <span className="inline-flex min-h-[34px] items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/15 px-3 py-2 text-xs">
              Em andamento: <b>{stats.emAndamento}</b>
            </span>
            <span className="inline-flex min-h-[34px] items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-2 text-xs">
              Concluídas: <b>{stats.concluidas}</b>
            </span>
            <span className="inline-flex min-h-[34px] items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs">
              Total (busca): <b>{totalElements}</b>
            </span>
          </div>
        </div>

        <div
          className={`mt-4 flex flex-wrap items-center gap-3 ${
            busy ? "pointer-events-none opacity-70" : ""
          }`}
        >
          <label className="flex items-center gap-2">
            <span className="text-sm opacity-85">Tamanho</span>
            <select
              value={size}
              onChange={handleChangeSize}
              className="rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-zinc-900 outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-sm opacity-85">Ordenação</span>
            <select
              value={sort}
              onChange={handleChangeSort}
              className="rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-zinc-900 outline-none"
            >
              <option value="id,desc">Mais novas (id desc)</option>
              <option value="id,asc">Mais antigas (id asc)</option>
              <option value="titulo,asc">Título (A–Z)</option>
              <option value="titulo,desc">Título (Z–A)</option>
              <option value="dataLimite,asc">Vencimento (asc)</option>
              <option value="dataLimite,desc">Vencimento (desc)</option>
            </select>
          </label>
        </div>

        <div
          className={`mt-3 flex flex-wrap items-center gap-3 ${
            busy ? "pointer-events-none opacity-70" : ""
          }`}
        >
          <label className="flex min-w-[280px] flex-1 items-center gap-2">
            <span className="whitespace-nowrap text-sm opacity-85">Buscar</span>
            <input
              value={buscaInput}
              onChange={(e) => setBuscaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Título ou descrição..."
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/50"
            />
          </label>

          <button
            type="button"
            onClick={applySearch}
            disabled={busy}
            className={`rounded-xl border border-white/15 px-3 py-2 text-sm ${
              busy ? "cursor-not-allowed opacity-50" : "bg-white/10 hover:bg-white/15"
            }`}
          >
            Buscar
          </button>

          <label className="flex items-center gap-2">
            <span className="text-sm opacity-85">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusAtividade | "");
                setPage(0);
              }}
              className="rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-zinc-900 outline-none"
            >
              <option value="">Todos</option>
              <option value="A_FAZER">A fazer</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="CONCLUIDA">Concluída</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-sm opacity-85">Prioridade</span>
            <select
              value={prioridadeFilter}
              onChange={(e) => {
                setPrioridadeFilter(e.target.value as PrioridadeAtividade | "");
                setPage(0);
              }}
              className="rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-zinc-900 outline-none"
            >
              <option value="">Todas</option>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
            </select>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters || busy}
            className={`rounded-xl border border-white/15 px-3 py-2 text-sm ${
              !hasFilters || busy
                ? "cursor-not-allowed opacity-50"
                : "bg-white/10 hover:bg-white/15"
            }`}
          >
            Limpar filtros
          </button>
        </div>
      </header>

      {erro && (
        <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {erro}
        </div>
      )}

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_14px_45px_rgba(0,0,0,0.18)] backdrop-blur">
        <TaskForm
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          atividadeEmEdicao={atividadeEmEdicao}
          onCancelEdit={handleCancelEdit}
          setError={setErro}
          busy={busy}
        />
      </section>

      <section className="mt-4">
        <TaskList
          atividades={atividades}
          carregandoLista={carregandoLista}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onPatchStatus={handlePatchStatus}
          onPatchPriority={handlePatchPriority}
          page={page}
          totalPages={totalPages}
          onPrev={goPrev}
          onNext={goNext}
          busy={busy}
        />
      </section>
    </div>
  );
}






















