import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function LoginView() {
  const [identificacion, setIdentificacion] = useState("");
  const [password, setPassword] = useState("123456");
  const [isDoctor, setIsDoctor] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificacion: identificacion.trim(), password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('cardex_user', JSON.stringify(data));
        if (data.rol === 'doctor') {
          navigate('/doctor');
        } else {
          navigate(`/paciente/${data.id}`);
        }
      } else {
        setError("Credenciales inválidas. Inténtalo de nuevo.");
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full space-y-6 text-center">

        <div className="space-y-2">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/40 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner">
            🩺
          </div>
          <h1 className="text-3xl font-extrabold text-blue-400 tracking-tight">Cardex Fisioterapia</h1>
          <p className="text-sm text-slate-400">
            Plataforma de seguimiento y rehabilitación inteligente
          </p>
        </div>

        <div className="flex bg-slate-800 rounded-xl p-1 mb-4">
            <button 
              onClick={() => setIsDoctor(false)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${!isDoctor ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Paciente
            </button>
            <button 
              onClick={() => setIsDoctor(true)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${isDoctor ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Doctor
            </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
            {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {isDoctor ? "Cédula Médica" : "ID de Paciente / Identificación"}
              </label>
              <input
                type="text"
                value={identificacion}
                onChange={(e) => setIdentificacion(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 font-semibold"
                placeholder={isDoctor ? "Ej: 123456789" : "Ej: 1"}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 font-semibold"
                placeholder="********"
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full ${isDoctor ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-500'} px-6 py-3.5 rounded-xl font-bold transition text-white shadow-lg cursor-pointer text-sm`}
            >
              Ingresar al Portal
            </button>
        </form>

        <div className="pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 flex justify-between items-center px-1 mt-6">
          <span>v1.1 Autenticación Segura</span>
          <span className="text-emerald-400 font-medium">● Servidor Activo</span>
        </div>

      </div>
    </div>
  );
}