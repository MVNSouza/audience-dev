import { Link } from 'react-router-dom';
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          Audience
        </Link>
        <nav>
          <Link to="/create">Criar sessão</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
