import { Routes, Route } from 'react-router-dom';
import App from './App';
import ProxyDemo from './pages/ProxyDemo';

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/proxy-demo" element={<ProxyDemo />} />
    </Routes>
  );
}

export default AppRouter; 