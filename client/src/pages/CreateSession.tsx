import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Question, ScaleType } from '../lib/api';
const presets: [string, ScaleType][] = [
  ['Estrelas (1–5)', 'stars'],
  ['Nota (0–10)', 'number'],
  ['Tomates (1–5)', 'tomatoes'],
  ['Gamificada (1–5)', 'gamified'],
];
export default function CreateSession() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    {
      title: 'Como você avalia a apresentação?',
      type: 'scale',
      scaleType: 'stars',
      min: 1,
      max: 5,
      required: true,
    },
  ]);
  const [error, setError] = useState('');
  const nav = useNavigate();
  const patch = (i: number, p: Partial<Question>) =>
    setQuestions((a) => a.map((q, j) => (j === i ? { ...q, ...p } : q)));
  const add = () =>
    setQuestions((a) => [
      ...a,
      { title: '', type: 'scale', scaleType: 'stars', min: 1, max: 5, required: true },
    ]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const r = await api.createSession({ title, description, questions });
      nav(
        `/manage/${r.session.accessCode}?token=${encodeURIComponent(r.session.adminToken ?? '')}`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar a sessão.');
    }
  }
  return (
    <section className="page narrow">
      <span className="eyebrow">Professor</span>
      <h1>Crie uma sessão de avaliação</h1>
      <p className="muted">A sessão fica disponível por até 7 dias e não exige login.</p>
      <form className="card form" onSubmit={submit}>
        <label>
          Título
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Apresentação de Redes de Computadores"
          />
        </label>
        <label>
          Descrição
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Feedback da turma sobre a apresentação."
          />
        </label>
        <div className="section-heading">
          <h2>Perguntas</h2>
          <button type="button" className="button ghost small" onClick={add}>
            + Pergunta
          </button>
        </div>
        {questions.map((q, i) => (
          <div className="question-editor" key={i}>
            <label>
              Pergunta {i + 1}
              <input
                required
                value={q.title}
                onChange={(e) => patch(i, { title: e.target.value })}
              />
            </label>
            <label>
              Escala
              <select
                value={q.scaleType}
                onChange={(e) => {
                  const type = e.target.value as ScaleType;
                  patch(i, {
                    scaleType: type,
                    min: type === 'number' ? 0 : 1,
                    max: type === 'number' ? 10 : 5,
                  });
                }}
              >
                {presets.map(([label, type]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={q.required !== false}
                onChange={(e) => patch(i, { required: e.target.checked })}
              />{' '}
              Obrigatória
            </label>
          </div>
        ))}
        {error && <div className="error">{error}</div>}
        <button className="button primary wide">Criar sessão</button>
      </form>
    </section>
  );
}
