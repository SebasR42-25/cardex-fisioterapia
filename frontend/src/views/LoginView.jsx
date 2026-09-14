import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginView() {
  const [pacienteIdInput, setPacienteIdInput] = useState("1");
  const navigate = useNavigate();

  const handleSubmitPaciente = (e) => {
    e.preventDefault();
    if (pacienteIdInput.trim()) {
      navigate(`/paciente/${pacienteIdInput.trim()}`);
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
            Plataforma de seguimiento y rehabilitación inteligente para adultos mayores
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          {/* Acceso Paciente */}
          <form onSubmit={handleSubmitPaciente} className="text-left space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Acceso Paciente (ID / Pulsera NFC / QR)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={pacienteIdInput}
                onChange={(e) => setPacienteIdInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 font-semibold"
                placeholder="ID Paciente (ej: 1)"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition text-white shadow-lg cursor-pointer text-sm whitespace-nowrap"
              >
                Entrar ➔
              </button>
            </div>
          </form>

          {/* Botones de Acceso Rápido */}
          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => navigate('/paciente/1')}
              className="w-full bg-slate-800/80 hover:bg-slate-800 border border-blue-500/30 text-blue-300 font-semibold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>👤</span> Iniciar como Paciente Demo (ID #1 - Juan Pablo)
            </button>

            <button
              onClick={() => navigate('/doctor')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-xl flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <span>👩‍⚕️</span> Ingresar al Portal Médico (Cardex & Gestión)
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-500 flex justify-between items-center px-1">
          <span>v1.0 Listo para Evaluación</span>
          <span className="text-emerald-400 font-medium">● Servidor Activo</span>
        </div>

      </div>
    </div>
  );
}