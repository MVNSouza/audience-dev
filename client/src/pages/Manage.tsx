import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api, Session } from '../lib/api';
export default function Manage() {
  const { code = '' } = useParams();
  const [search] = useSearchParams();
  const token = search.get('token') ?? '';
  const [session, setSession] = useState<Session>();
  const [results, setResults] = useState<any>();
  const [error, setError] = useState('');
  async function load() {
    try {
      const [s, r] = await Promise.all([api.getSession(code), api.getResults(code, token)]);
      setSession(s.session);
      setResults(r.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar sessão.');
    }
  }
  useEffect(() => {
    load();
  }, [code]);
  async function close() {
    if (!confirm('Encerrar esta sessão?')) return;
    const r = await api.closeSession(code, token);
    setSession(r.session);
  }
  const voteUrl = `${window.location.origin}/vote/${code}`;
  return (
    <section className="page">
      <div className="manage-head">
        <div>
          <span className="eyebrow">Painel do professor</span>
          <h1>{session?.title ?? 'Sessão'}</h1>
          <p className="muted">
            Código: <strong>{code}</strong>
          </p>
        </div>
        {session?.status === 'active' && (
          <button className="button danger" onClick={close}>
            Encerrar
          </button>
        )}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="dashboard-grid">
        <div className="card qr-card">
          <h2>QR Code</h2>
          <div className="qr-wrap">
            {(() => {
              const QR: any = QRCodeSVG;
              return <QR value={voteUrl} size={250} includeMargin />;
            })()}
          </div>
          <p className="muted">Aponte a câmera do celular para abrir a avaliação.</p>
          <code>{voteUrl}</code>
        </div>
        <div className="card results-card">
          <div className="section-heading">
            <h2>Resultados</h2>
            <button className="button ghost small" onClick={load}>
              Atualizar
            </button>
          </div>
          {results?.questions?.map((q: any) => (
            <div className="result-block" key={q.id}>
              <div className="result-title">
                <span>{q.title}</span>
                <strong>{q.average ?? '—'}</strong>
              </div>
              <div className="bar">
                <span
                  style={{ width: `${Math.min(100, ((q.average ?? 0) / (q.max || 1)) * 100)}%` }}
                />
              </div>
              <small>{q.total} resposta(s)</small>
            </div>
          ))}
          {!results?.questions?.length && <p className="muted">Nenhuma resposta ainda.</p>}
        </div>
      </div>
      <div className="card info-card">
        <h2>Privacidade</h2>
        <p>
          As avaliações são anônimas. O sistema usa um identificador aleatório no navegador apenas
          para impedir múltiplos envios na mesma sessão. As sessões expiram após 7 dias.
        </p>
      </div>
    </section>
  );
}
