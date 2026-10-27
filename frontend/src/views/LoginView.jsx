import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function LoginView() {
  const [identificacion, setIdentificacion] = useState("1");
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
    } catch {
      setError("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-teal-50 via-sky-50 to-blue-100 text-slate-800 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white/95 border border-teal-100 p-6 sm:p-9 rounded-3xl shadow-xl max-w-md w-full space-y-6 text-center">

        <div className="space-y-2">
          <div className="w-16 h-16 bg-teal-50 border border-teal-200 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner">
            🩺
          </div>
          <h1 className="text-3xl font-extrabold text-teal-800 tracking-tight">Cardex Fisioterapia</h1>
          <p className="text-sm text-slate-600">
            Tus ejercicios y seguimiento, en un solo lugar
          </p>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
            <button 
              onClick={() => { setIsDoctor(false); setIdentificacion('1'); }}
              className={`flex-1 min-h-11 py-2 text-sm font-bold rounded-lg transition ${!isDoctor ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Paciente
            </button>
            <button 
              onClick={() => { setIsDoctor(true); setIdentificacion('123456789'); }}
              className={`flex-1 min-h-11 py-2 text-sm font-bold rounded-lg transition ${isDoctor ? 'bg-indigo-700 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Doctor
            </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
            {error && <p role="alert" className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl text-sm font-bold text-center">{error}</p>}
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">
                {isDoctor ? "Cédula Médica" : "ID de Paciente / Identificación"}
              </label>
              <input
                type="text"
                value={identificacion}
                onChange={(e) => setIdentificacion(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
                placeholder={isDoctor ? "Ej: 123456789" : "Ej: 1"}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
                placeholder="********"
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full min-h-12 ${isDoctor ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-teal-700 hover:bg-teal-800'} px-6 py-3.5 rounded-xl font-bold transition text-white shadow-lg cursor-pointer text-base`}
            >
              Ingresar al Portal
            </button>
        </form>

        <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 flex justify-between items-center px-1 mt-6">
          <span>Acceso de demostración</span>
          <span className="text-emerald-700 font-medium">● Portal disponible</span>
        </div>

        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-left space-y-2">
          <p className="text-sm font-bold text-slate-800">Datos de prueba</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setIsDoctor(false); setIdentificacion('1'); setPassword('123456'); }} className="min-h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-teal-50">Paciente · ID 1</button>
            <button type="button" onClick={() => { setIsDoctor(true); setIdentificacion('123456789'); setPassword('123456'); }} className="min-h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-indigo-50">Médico · cédula de prueba</button>
          </div>
          <p className="text-xs text-slate-600">Contraseña de prueba: <strong>123456</strong></p>
        </div>

      </div>
    </div>
  );
}
