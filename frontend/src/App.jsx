import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginView from './views/LoginView';
import PacienteView from './views/PacienteView';
import DoctorView from './views/DoctorView';
import ChatWidget from './components/ChatWidget';

function PrivateRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('cardex_user'));
  if (!user || user.rol !== 'doctor') {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-slate-950 text-slate-100">
        <Routes>
          <Route path="/" element={<LoginView />} />
          <Route path="/paciente/:id" element={<PacienteView />} />
          <Route path="/doctor" element={
            <PrivateRoute>
              <DoctorView />
            </PrivateRoute>
          } />
        </Routes>
        <ChatWidget />
      </div>
    </Router>
  );
}