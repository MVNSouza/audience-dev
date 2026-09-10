import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
export default function Home() {
  const [c, setC] = useState('');
  const nav = useNavigate();
  const enter = () => {
    const x = c.trim().toUpperCase();
    if (x) nav(`/vote/${x}`);
  };
  return (
    <section className="hero">
      <div>
        <span className="eyebrow">Avaliação acadêmica em tempo real</span>
        <h1>Transforme a apresentação em feedback.</h1>
        <p>
          O Audience permite que professores criem avaliações rápidas e anônimas e que alunos
          respondam pelo celular, usando um QR Code.
        </p>
        <div className="hero-actions">
          <Link className="button primary" to="/create">
            Criar sessão
          </Link>
          <label className="join-box">
            <input
              value={c}
              onChange={(e) => setC(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enter()}
              placeholder="Código da sessão"
            />
            <button className="button ghost" onClick={enter}>
              Entrar
            </button>
          </label>
        </div>
      </div>
      <div className="hero-card">
        <div className="mini-label">COMO FUNCIONA</div>
        {[
          ['01', 'Professor cria o modelo de avaliação.'],
          ['02', 'Audience gera um QR Code para a turma.'],
          ['03', 'Alunos avaliam anonimamente pelo celular.'],
          ['04', 'Professor acompanha os resultados.'],
        ].map(([n, t]) => (
          <div className="step" key={n}>
            <b>{n}</b>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
