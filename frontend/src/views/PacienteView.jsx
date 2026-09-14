import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../config';

export default function PacienteView() {
  const { id } = useParams();

  const [paciente, setPaciente] = useState(null);
  const [rutinasAsignadas, setRutinasAsignadas] = useState([]);
  const [cardex, setCardex] = useState([]);
  const [videoActivo, setVideoActivo] = useState(null);
  const [tituloVideoActivo, setTituloVideoActivo] = useState("");
  const [loading, setLoading] = useState(true);

  // Estados Formulario de Opiniones / Feedback para el Doctor
  const [sensacionDolor, setSensacionDolor] = useState("Sin dolor 😊");
  const [comentarioFeedback, setComentarioFeedback] = useState("");
  const [feedbackEnviadoExito, setFeedbackEnviadoExito] = useState(false);
  const [historialFeedback, setHistorialFeedback] = useState([]);

  const videoPlayerRef = useRef(null);

  const cargarDatos = useCallback(() => {
    fetch(`${API_URL}/pacientes/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setPaciente(data))
      .catch(() => setPaciente(null));

    fetch(`${API_URL}/pacientes/${id}/rutinas`)
      .then(res => res.json())
      .then(data => {
        setRutinasAsignadas(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar rutinas:", err);
        setLoading(false);
      });

    fetch(`${API_URL}/pacientes/${id}/cardex`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setCardex(Array.isArray(data) ? data : []))
      .catch(() => setCardex([]));

    fetch(`${API_URL}/pacientes/${id}/feedback`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setHistorialFeedback(Array.isArray(data) ? data : []))
      .catch(() => setHistorialFeedback([]));
  }, [id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const toggleCompletado = async (rutinaId, estadoActual) => {
    const nuevoEstado = !estadoActual;

    const response = await fetch(`${API_URL}/rutinas/${rutinaId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completado_hoy: nuevoEstado })
    });

    if (response.ok) {
      setRutinasAsignadas(prev => prev.map(r =>
        r.id === rutinaId ? { ...r, completado_hoy: nuevoEstado } : r
      ));
    }
  };

  const reproducirVideo = (rutina) => {
    const titulo = rutina.ejercicio?.titulo || "Ejercicio de Fisioterapia";
    let url = rutina.ejercicio?.url_video || "/videos/rodilla.mp4";
    if (!rutina.ejercicio?.url_video && titulo.toLowerCase().includes("caminata")) {
      url = "/videos/caminata.mp4";
    }
    setVideoActivo(url);
    setTituloVideoActivo(titulo);

    setTimeout(() => {
      videoPlayerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const enviarFeedbackDoctor = async (e) => {
    e.preventDefault();
    if (!comentarioFeedback.trim()) return;

    const res = await fetch(`${API_URL}/pacientes/${id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sensacion_dolor: sensacionDolor,
        comentario: comentarioFeedback.trim()
      })
    });

    if (res.ok) {
      setFeedbackEnviadoExito(true);
      setComentarioFeedback("");
      setTimeout(() => setFeedbackEnviadoExito(false), 4000);
      const updatedFb = await fetch(`${API_URL}/pacientes/${id}/feedback`).then(r => r.json());
      setHistorialFeedback(Array.isArray(updatedFb) ? updatedFb : []);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xl font-bold">
        Cargando tus ejercicios y expediente... 🔄
      </div>
    );
  }

  // Separamos las rutinas en dos módulos claros
  const rutinasPendientes = rutinasAsignadas.filter(r => !r.completado_hoy);
  const rutinasHechas = rutinasAsignadas.filter(r => r.completado_hoy);

  // Última nota del médico
  const ultimaNotaCardex = cardex.length > 0 ? cardex[0] : null;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">

        {/* Barra superior de navegación */}
        <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-2xl">
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5 font-semibold"
          >
            <span>←</span> Volver al Inicio
          </Link>
          <Link
            to="/doctor"
            className="text-xs bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1"
          >
            <span>👩‍⚕️</span> Ir al Portal Médico
          </Link>
        </div>

        {/* Encabezado Accesible */}
        <header className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-3 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-3xl">👋</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-blue-400 tracking-tight">
                Hola, {paciente ? paciente.nombre : `Paciente #${id}`}
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Tu portal personal de fisioterapia. Sigue las instrucciones de tus videos y completa tus rutinas diarias.
            </p>
          </div>

          <div className="bg-blue-950/80 border border-blue-800/80 px-4 py-3 rounded-2xl text-center">
            <span className="text-[11px] text-blue-300 font-bold block uppercase">Progreso de Hoy:</span>
            <span className="text-xl font-extrabold text-white">
              {rutinasHechas.length} / {rutinasAsignadas.length} <span className="text-emerald-400 text-sm">Completados</span>
            </span>
          </div>
        </header>

        {/* NOTAS Y RECOMENDACIONES DE EVOLUCIÓN DEJADAS POR SU MÉDICO */}
        {ultimaNotaCardex && (
          <div className="bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-500/40 p-6 rounded-3xl shadow-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👨‍⚕️</span>
              <h3 className="text-lg font-extrabold text-blue-300">
                Indicaciones y Notas de tu Médico Tratante
              </h3>
            </div>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed bg-slate-900/80 p-4 rounded-2xl border border-blue-500/20 font-medium">
              "{ultimaNotaCardex.notas_clinicas}"
            </p>
            <span className="text-[11px] text-blue-400 block text-right font-semibold">
              Última actualización: {ultimaNotaCardex.fecha ? new Date(ultimaNotaCardex.fecha).toLocaleDateString() : 'Reciente'}
            </span>
          </div>
        )}

        {/* REPRODUCTOR DE VIDEO AMPLIO Y CENTRADO */}
        {videoActivo && (
          <div ref={videoPlayerRef} className="bg-slate-900 border-2 border-blue-500/60 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Reproduciendo Video Interactivo:</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">{tituloVideoActivo}</h3>
              </div>
              <button
                onClick={() => setVideoActivo(null)}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition shadow-lg cursor-pointer"
              >
                ✕ Cerrar Video
              </button>
            </div>

            {/* Frame Amplio de Video */}
            <div className="w-full bg-black rounded-3xl overflow-hidden shadow-2xl flex justify-center border border-slate-700">
              <video key={videoActivo} controls autoPlay className="w-full max-h-[550px] object-contain">
                <source src={videoActivo} type="video/mp4" />
                Tu navegador no soporta la reproducción directa de este video.
              </video>
            </div>
            <p className="text-xs text-slate-400 text-center italic">
              💡 Tip: Realiza el ejercicio a tu propio ritmo. Si sientes fatiga o dolor agudo, pausa el video y descansa.
            </p>
          </div>
        )}

        {/* MÓDULO 1: EJERCICIOS PENDIENTES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <span>⏱️</span> Módulo 1: Ejercicios Pendientes para Hoy
            </h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
              {rutinasPendientes.length} por realizar
            </span>
          </div>

          {rutinasPendientes.length === 0 ? (
            <div className="bg-slate-900/60 border border-emerald-500/30 p-8 rounded-3xl text-center space-y-2">
              <span className="text-4xl">🎉</span>
              <h4 className="text-lg font-bold text-emerald-400">¡Excelente trabajo!</h4>
              <p className="text-slate-300 text-sm">Has completado todos tus ejercicios asignados para el día de hoy.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rutinasPendientes.map((rutina) => {
                const titulo = rutina.ejercicio?.titulo || (rutina.ejercicio_id === 2 ? "Caminata Estática" : "Extensión de Rodilla");
                const descripcion = rutina.ejercicio?.descripcion || (
                  titulo.toLowerCase().includes("caminata")
                    ? "Excelente para mejorar la resistencia cardiovascular de bajo impacto y activar la circulación en piernas."
                    : "Ideal para fortalecer cuádriceps y recuperar movilidad articular tras cirugías o desgaste leve."
                );

                return (
                  <div key={rutina.id} className="bg-slate-900 border border-blue-600/50 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-xl font-extrabold text-white leading-snug">{titulo}</h3>
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap">
                          Pendiente ⏱️
                        </span>
                      </div>

                      {/* Pequeña Descripción Instructiva */}
                      <p className="text-slate-300 text-sm italic bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 leading-relaxed">
                        {descripcion}
                      </p>

                      <p className="text-slate-300 text-sm font-semibold">
                        <strong className="text-blue-400">Frecuencia / Repeticiones:</strong> {rutina.frecuencia}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => reproducirVideo(rutina)}
                        className="flex-1 py-3.5 px-4 rounded-2xl text-sm font-extrabold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                      >
                        ▶ Ver Video
                      </button>
                      <button
                        onClick={() => toggleCompletado(rutina.id, rutina.completado_hoy)}
                        className="py-3.5 px-5 rounded-2xl text-sm font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        ✓ Marcar Hecho
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* MÓDULO 2: EJERCICIOS COMPLETADOS */}
        {rutinasHechas.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-emerald-400 flex items-center gap-2">
                <span>✅</span> Módulo 2: Ejercicios Realizados Hoy
              </h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                {rutinasHechas.length} completados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rutinasHechas.map((rutina) => {
                const titulo = rutina.ejercicio?.titulo || (rutina.ejercicio_id === 2 ? "Caminata Estática" : "Extensión de Rodilla");
                const descripcion = rutina.ejercicio?.descripcion || (
                  titulo.toLowerCase().includes("caminata")
                    ? "Excelente para mejorar la resistencia cardiovascular de bajo impacto y activar la circulación en piernas."
                    : "Ideal para fortalecer cuádriceps y recuperar movilidad articular tras cirugías o desgaste leve."
                );

                return (
                  <div key={rutina.id} className="bg-slate-900/80 border border-emerald-500/40 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4 opacity-95">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-xl font-extrabold text-slate-200">{titulo}</h3>
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap">
                          ¡Completado! ✅
                        </span>
                      </div>

                      <p className="text-slate-400 text-xs italic bg-slate-800/50 p-3 rounded-2xl border border-slate-700/40 leading-relaxed">
                        {descripcion}
                      </p>

                      <p className="text-slate-400 text-sm">
                        <strong className="text-slate-300">Frecuencia:</strong> {rutina.frecuencia}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => reproducirVideo(rutina)}
                        className="flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        ▶ Ver de Nuevo
                      </button>
                      <button
                        onClick={() => toggleCompletado(rutina.id, rutina.completado_hoy)}
                        className="py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition shadow cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECCIÓN DE OPINIONES Y MENSAJES PARA EL DOCTOR */}
        <section className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💬</span>
            <div>
              <h3 className="text-2xl font-extrabold text-white">Opiniones y Mensajes a tu Médico</h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Cuéntale a tu doctor cómo te sentiste durante los ejercicios de hoy o indícale si tuviste alguna dificultad:
              </p>
            </div>
          </div>

          {feedbackEnviadoExito && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in">
              <span>✅</span> ¡Tu mensaje y reporte de dolor fueron enviados exitosamente a tu médico!
            </div>
          )}

          <form onSubmit={enviarFeedbackDoctor} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-bold">¿CÓMO TE SENTISTE DURANTE EL EJERCICIO?</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {["Sin dolor 😊", "Molestia leve 😐", "Dolor moderado 😣", "Dolor intenso 😫"].map((opcion) => (
                  <button
                    type="button"
                    key={opcion}
                    onClick={() => setSensacionDolor(opcion)}
                    className={`p-3 rounded-2xl text-xs sm:text-sm font-bold border transition cursor-pointer flex items-center justify-center ${
                      sensacionDolor === opcion
                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {opcion}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-bold">MENSAJE O COMENTARIO PARTICULAR:</label>
              <textarea
                rows="3"
                value={comentarioFeedback}
                onChange={(e) => setComentarioFeedback(e.target.value)}
                placeholder="Ej. 'Me dolió un poco al final de la tercera repetición', 'Hoy sentí mayor facilidad para caminar'..."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base py-4 rounded-2xl transition shadow-xl cursor-pointer"
            >
              Enviar Mensaje al Doctor 📨
            </button>
          </form>

          {/* Historial de Mensajes Enviados */}
          {historialFeedback.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tus Mensajes Enviados Recientes:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {historialFeedback.map((fb, idx) => (
                  <div key={idx} className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-400">{fb.sensacion_dolor}</span>
                      <span className="text-[10px] text-slate-500">{fb.fecha ? new Date(fb.fecha).toLocaleDateString() : 'Hoy'}</span>
                    </div>
                    <p className="text-slate-300">"{fb.comentario}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}