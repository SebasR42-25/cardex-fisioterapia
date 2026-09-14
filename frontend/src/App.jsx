import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginView from './views/LoginView';
import PacienteView from './views/PacienteView';
import DoctorView from './views/DoctorView';
import ChatWidget from './components/ChatWidget';

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-slate-950 text-slate-100">
        <Routes>
          <Route path="/" element={<LoginView />} />
          <Route path="/paciente/:id" element={<PacienteView />} />
          <Route path="/doctor" element={<DoctorView />} />
        </Routes>
        <ChatWidget />
      </div>
    </Router>
  );
}