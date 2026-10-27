import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatWidget from './components/ChatWidget';

const LoginView = lazy(() => import('./views/LoginView'));
const PacienteView = lazy(() => import('./views/PacienteView'));
const DoctorView = lazy(() => import('./views/DoctorView'));

function PrivateRoute({ children }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('cardex_user'));
  } catch {
    localStorage.removeItem('cardex_user');
  }
  if (!user || user.rol !== 'doctor') {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-slate-950 text-slate-100">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-blue-50 text-slate-800 text-lg font-bold" role="status">Cargando el portal…</div>}>
          <Routes>
            <Route path="/" element={<LoginView />} />
            <Route path="/paciente/:id" element={<PacienteView />} />
            <Route path="/doctor" element={
              <PrivateRoute>
                <DoctorView />
              </PrivateRoute>
            } />
          </Routes>
        </Suspense>
        <ChatWidget />
      </div>
    </Router>
  );
}
