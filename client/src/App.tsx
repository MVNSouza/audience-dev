import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CreateSession from './pages/CreateSession';
import Vote from './pages/Vote';
import Manage from './pages/Manage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateSession />} />
        <Route path="/vote/:code" element={<Vote />} />
        <Route path="/manage/:code" element={<Manage />} />
      </Routes>
    </Layout>
  );
}
