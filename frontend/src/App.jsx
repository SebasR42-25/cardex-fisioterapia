import { lazy, Suspense, useEffect, useState } from 'react';
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
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('cardex_theme') !== 'light';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cardex_theme', darkMode ? 'dark' : 'light');
    } catch {
      // The selected theme still works for this session when storage is unavailable.
    }
  }, [darkMode]);

  const sharedProps = { darkMode, setDarkMode };

  return (
    <Router>
      <div className={`${darkMode ? 'dark-app bg-slate-950 text-slate-100' : 'light-app bg-teal-50 text-slate-800'} relative min-h-screen`}>
        <Suspense fallback={<div className={`min-h-screen flex items-center justify-center text-lg font-bold ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-teal-50 text-slate-800'}`} role="status">Cargando el portal…</div>}>
          <Routes>
            <Route path="/" element={<LoginView {...sharedProps} />} />
            <Route path="/paciente/:id" element={<PacienteView {...sharedProps} />} />
            <Route path="/doctor" element={
              <PrivateRoute>
                <DoctorView {...sharedProps} />
              </PrivateRoute>
            } />
          </Routes>
        </Suspense>
        <ChatWidget />
      </div>
    </Router>
  );
}
