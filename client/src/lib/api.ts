const API_BASE = import.meta.env.VITE_API_URL ?? '';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  const b = await r.json().catch(() => null);
  if (!r.ok) throw new Error(b?.message ?? 'Ocorreu um erro na API.');
  return b as T;
}
export type ScaleType = 'stars' | 'number' | 'tomatoes' | 'gamified';
export type QuestionType = 'scale' | 'text';
export type Question = {
  id?: number;
  title: string;
  type: QuestionType;
  scaleType?: ScaleType;
  min?: number;
  max?: number;
  required?: boolean;
  description?: string;
};
export type Session = {
  id: string;
  title: string;
  description: string;
  accessCode: string;
  adminToken?: string;
  status: 'active' | 'closed';
  expiresAt: string;
  createdAt: string;
  questions: Question[];
};
export const api = {
  createSession: (p: { title: string; description: string; questions: Question[] }) =>
    request<{ session: Session }>('/api/sessions', { method: 'POST', body: JSON.stringify(p) }),
  getSession: (c: string) => request<{ session: Session }>(`/api/sessions/${c}`),
  closeSession: (c: string, t: string) =>
    request<{ session: Session }>(`/api/sessions/${c}/close`, {
      method: 'POST',
      body: JSON.stringify({ adminToken: t }),
    }),
  submitEvaluation: (c: string, p: Record<string, unknown>) =>
    request<{ message: string }>(`/api/sessions/${c}/evaluations`, {
      method: 'POST',
      body: JSON.stringify(p),
    }),
  getResults: (c: string, t: string) =>
    request<{ results: any }>(`/api/sessions/${c}/results?adminToken=${encodeURIComponent(t)}`),
};
export function getVoterId() {
  const k = 'audience_voter_id';
  let v = localStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(k, v);
  }
  return v;
}
