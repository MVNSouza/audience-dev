import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, getVoterId, Session } from '../lib/api';
function Scale({
  type,
  value,
  onChange,
}: {
  type: string;
  value?: number;
  onChange: (v: number) => void;
}) {
  const vals = type === 'number' ? Array.from({ length: 11 }, (_, i) => i) : [1, 2, 3, 4, 5];
  return (
    <div className={`scale scale-${type}`}>
      {vals.map((n) => {
        const isFilled = typeof value === 'number' && n <= value;
        const isOutline =
          typeof value === 'number' &&
          n > (value ?? 0) &&
          (type === 'stars' || type === 'tomatoes');
        const className = isFilled ? 'filled' : isOutline ? 'outline' : '';
        return (
          <button
            type="button"
            key={n}
            className={className}
            onClick={() => onChange(n)}
            aria-pressed={isFilled}
          >
            {type === 'stars'
              ? '★'
              : type === 'tomatoes'
                ? '🍅'
                : type === 'gamified'
                  ? ['😖', '😕', '😐', '🙂', '🤩'][n - 1]
                  : n}
          </button>
        );
      })}
    </div>
  );
}
export default function Vote() {
  const { code = '' } = useParams();
  const [session, setSession] = useState<Session>();
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [status, setStatus] = useState('loading');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    api
      .getSession(code)
      .then((r) => {
        setSession(r.session);
        setStatus('ready');
      })
      .catch((e) => {
        setMsg(e.message);
        setStatus('error');
      });
  }, [code]);
  const progress = useMemo(() => {
    if (!session) return 0;
    return Math.round(
      (session.questions.filter((q) => answers[String(q.id)] !== undefined).length /
        session.questions.length) *
        100
    );
  }, [answers, session]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    try {
      await api.submitEvaluation(code, { voterId: getVoterId(), answers });
      setStatus('submitted');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Falha ao enviar avaliação.');
      setStatus('error');
    }
  }
  if (status === 'loading') return <section className="center-state">Carregando sessão…</section>;
  if (status === 'error')
    return (
      <section className="center-state">
        <div className="card">
          <h2>Não foi possível entrar</h2>
          <p>{msg}</p>
        </div>
      </section>
    );
  if (status === 'submitted')
    return (
      <section className="center-state">
        <div className="success-card">
          <span className="success-icon">✓</span>
          <h1>Obrigado!</h1>
          <p>Sua avaliação foi registrada anonimamente.</p>
        </div>
      </section>
    );
  if (!session) return null;
  return (
    <section className="page narrow vote-page">
      <span className="eyebrow">Sessão {session.accessCode}</span>
      <h1>{session.title}</h1>
      {session.description && <p className="muted">{session.description}</p>}
      <div className="progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <form onSubmit={submit}>
        {session.questions.map((q, i) => (
          <div className="card vote-card" key={q.id}>
            <div className="question-number">{String(i + 1).padStart(2, '0')}</div>
            <h2>{q.title}</h2>
            {q.type === 'text' ? (
              <textarea
                required={q.required !== false}
                value={(answers[String(q.id)] as string) || ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [String(q.id)]: e.target.value }))}
              />
            ) : (
              <Scale
                type={q.scaleType ?? 'stars'}
                value={answers[String(q.id)] as number | undefined}
                onChange={(v) => setAnswers((a) => ({ ...a, [String(q.id)]: v }))}
              />
            )}
          </div>
        ))}
        <button className="button primary wide" disabled={progress < 100}>
          Enviar avaliação
        </button>
        <p className="privacy-note">Sua avaliação não pede nome, e-mail ou login.</p>
      </form>
    </section>
  );
}
