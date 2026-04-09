import axios from "axios";

export type StatusAtividade = "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDA";
export type PrioridadeAtividade = "BAIXA" | "MEDIA" | "ALTA";

export type Atividade = {
  id: number;
  titulo: string;
  descricao: string | null;
  status: StatusAtividade;
  prioridade: PrioridadeAtividade;
  dataLimite: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
};

export type PageInfo = {
  totalPages: number;
  number: number;
  totalElements: number;
};

export type PageResponse<T> = {
  content: T[];
  page?: PageInfo;
  totalPages?: number;
  totalElements?: number;
};

export type ListarAtividadesParams = {
  page?: number;
  size?: number;
  sort?: string;
  q?: string;
  status?: StatusAtividade;
  prioridade?: PrioridadeAtividade;
};

export type CriarAtividadePayload = {
  titulo: string;
  descricao?: string | null;
  status?: StatusAtividade;
  prioridade?: PrioridadeAtividade;
  dataLimite?: string | null;
};

export type AtualizarAtividadePayload = {
  titulo: string;
  descricao?: string | null;
  status?: StatusAtividade;
  prioridade?: PrioridadeAtividade;
  dataLimite?: string | null;
};

export type AtualizarParcialmenteAtividadePayload = Partial<
  Pick<Atividade, "status" | "prioridade" | "titulo" | "descricao" | "dataLimite">
>;

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

const DEFAULT_PROD_API_URL = "https://prioriza-api-njza.onrender.com";
const DEFAULT_DEV_API_URL = "/api";

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL);

const CHAVE_TOKEN_AUTENTICACAO = "prioriza_token";

export const api = axios.create({ baseURL });

export function obterTokenAutenticacao(): string | null {
  return localStorage.getItem(CHAVE_TOKEN_AUTENTICACAO);
}

export function definirTokenAutenticacao(token: string): void {
  localStorage.setItem(CHAVE_TOKEN_AUTENTICACAO, token);
}

export function limparTokenAutenticacao(): void {
  localStorage.removeItem(CHAVE_TOKEN_AUTENTICACAO);
}

api.interceptors.request.use((config) => {
  const token = obterTokenAutenticacao();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      limparTokenAutenticacao();
    }
    return Promise.reject(err);
  }
);

function limparParametros<T extends Record<string, unknown>>(params: T): Partial<T> {
  const out: Partial<T> = {};

  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null) continue;
    if (typeof valor === "string" && valor.trim() === "") continue;
    (out as Record<string, unknown>)[chave] = valor;
  }

  return out;
}

function normalizarRespostaListagem(data: unknown): PageResponse<Atividade> {
  if (Array.isArray(data)) {
    return {
      content: data as Atividade[],
      page: { totalPages: 1, number: 0, totalElements: data.length },
      totalPages: 1,
      totalElements: data.length,
    };
  }

  return data as PageResponse<Atividade>;
}

function normalizarAtividade(atividade: Atividade): Atividade {
  return {
    ...atividade,
    dataLimite: atividade.dataLimite ? atividade.dataLimite.slice(0, 10) : null,
  };
}

export async function fazerLogin(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api.post("/autenticacao/login", payload);
  const data = res.data as LoginResponse;

  if (data?.token) {
    definirTokenAutenticacao(data.token);
  }

  return data;
}

export async function listarAtividades(
  params: ListarAtividadesParams = {}
): Promise<PageResponse<Atividade>> {
  const res = await api.get("/atividades", {
    params: limparParametros(params),
  });

  const respostaNormalizada = normalizarRespostaListagem(res.data);

  return {
    ...respostaNormalizada,
    content: respostaNormalizada.content.map(normalizarAtividade),
  };
}

export async function criarAtividade(
  payload: CriarAtividadePayload
): Promise<Atividade> {
  const res = await api.post("/atividades", payload);
  return res.data as Atividade;
}

export async function excluirAtividade(id: number): Promise<void> {
  await api.delete(`/atividades/${id}`);
}

export async function atualizarAtividade(
  id: number,
  payload: AtualizarAtividadePayload
): Promise<Atividade> {
  const res = await api.put(`/atividades/${id}`, payload);
  return res.data as Atividade;
}

export async function atualizarParcialmenteAtividade(
  id: number,
  payload: AtualizarParcialmenteAtividadePayload
): Promise<Atividade> {
  const res = await api.patch(`/atividades/${id}`, payload);
  return res.data as Atividade;
}

export async function buscarAtividadePorId(id: number): Promise<Atividade> {
  const res = await api.get(`/atividades/${id}`);
  return res.data as Atividade;
}

