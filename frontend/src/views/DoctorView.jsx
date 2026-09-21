import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API_URL } from '../config';

export default function DoctorView() {
  // Pestaña activa: 'expediente', 'evolucion', 'dashboard', 'catalogo'
  const [pestañaActiva, setPestañaActiva] = useState('expediente');

  // Estados de Pacientes
  const [pacientesLista, setPacientesLista] = useState([]);
  const [idBuscado, setIdBuscado] = useState("1");
  const [pacienteIdActivo, setPacienteIdActivo] = useState("1");
  const [paciente, setPaciente] = useState(null);
  const [rutinasHoy, setRutinasHoy] = useState([]);
  const [cardex, setCardex] = useState([]);
  const [feedbackPaciente, setFeedbackPaciente] = useState([]);
  const [mostrarQrModal, setMostrarQrModal] = useState(false);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' }); // tipo: 'exito', 'error'

  const mostrarNotificacion = (mensaje, tipo = 'exito') => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion({ mensaje: '', tipo: '' }), 4000);
  };

  // Estados Catálogo de Ejercicios
  const ejerciciosCatalogoBase = [
    { id: 1, titulo: "Extensión de Rodilla", descripcion: "Ideal para fortalecer cuádriceps y recuperar movilidad articular tras cirugías o desgaste leve.", frecuenciaSugerida: "3 series de 10 repeticiones", url_video: "/videos/rodilla.mp4", zona_cuerpo: "Pierna" },
    { id: 2, titulo: "Caminata Estática", descripcion: "Excelente para mejorar la resistencia cardiovascular de bajo impacto y activar la circulación en piernas.", frecuenciaSugerida: "5 minutos continuos", url_video: "/videos/caminata.mp4", zona_cuerpo: "General" }
  ];
  const [ejerciciosCatalogo, setEjerciciosCatalogo] = useState(ejerciciosCatalogoBase);
  const [selectedEjercicioId, setSelectedEjercicioId] = useState(1);
  const [frecuenciaAsignar, setFrecuenciaAsignar] = useState("3 series de 10 repeticiones");

  // Estados Formulario Cardex y Evolución
  const [nivelDolor, setNivelDolor] = useState(2);
  const [rangoMovilidad, setRangoMovilidad] = useState("Completo/Fluido");
  const [estadoBanner, setEstadoBanner] = useState("Estable 🟢");
  const [observaciones, setObservaciones] = useState("");
  const [filtroHistorial, setFiltroHistorial] = useState("");

  // Estados Formulario de Registro de Nuevo Paciente
  const [mostrarFormCrear, setMostrarFormCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("123456");
  const [nuevaIdentificacion, setNuevaIdentificacion] = useState("");
  const [nuevoDatosMedicos, setNuevoDatosMedicos] = useState("");
  const [nuevasAlergias, setNuevasAlergias] = useState("");
  const [nuevasPrescripciones, setNuevasPrescripciones] = useState("");
  const [nuevasContraindicaciones, setNuevasContraindicaciones] = useState("");
  const [nuevosComentarios, setNuevosComentarios] = useState("");

  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const descargarPDF = () => {
    const element = document.getElementById('historia-clinica-pdf');
    if (!element) return;
    
    // 1. Cambiamos el estado para que React quite el scroll y muestre "Generando..."
    setIsPdfLoading(true);
    
    // 2. Esperamos a que React re-renderice y el DOM se expanda completamente
    setTimeout(() => {
      const opt = {
        margin:       10,
        filename:     `Historia_Clinica_${paciente?.nombre || 'Paciente'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2,
          // Ignorar botones e inputs en el PDF impreso
          ignoreElements: (node) => node.tagName === 'BUTTON' || node.tagName === 'INPUT' 
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().from(element).set(opt).save()
        .then(() => {
          setIsPdfLoading(false);
        })
        .catch((error) => {
          console.error("Error al generar PDF:", error);
          alert("Hubo un error al generar el documento PDF.");
          setIsPdfLoading(false);
        });
    }, 400); // Dar 400ms al navegador para recalcular el tamaño sin scroll
  };

  // Estados Formulario Nuevo Video Interactivo
  const [nuevoVideoTitulo, setNuevoVideoTitulo] = useState("");
  const [nuevoVideoZona, setNuevoVideoZona] = useState("Pierna");
  const [nuevoVideoDesc, setNuevoVideoDesc] = useState("");
  const [nuevoVideoUrl, setNuevoVideoUrl] = useState("/videos/rodilla.mp4");

  // Estados Dashboard de Estadísticas
  const [dashboardData, setDashboardData] = useState({
    total_pacientes: 0,
    total_rutinas: 0,
    completadas: 0,
    pendientes: 0,
    tasa_adherencia: 0,
    pacientes: []
  });

  // Cargar lista de pacientes y catálogo
  const cargarPacientes = () => {
    fetch(`${API_URL}/pacientes`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setPacientesLista(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const cargarEjercicios = () => {
    fetch(`${API_URL}/ejercicios-disponibles`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formateados = data.map(item => ({
            id: item.id,
            titulo: item.titulo,
            descripcion: item.descripcion,
            frecuenciaSugerida: item.frecuenciaSugerida || (item.id === 1 ? "3 series de 10 repeticiones" : "5 minutos continuos"),
            url_video: item.url_video || "/videos/rodilla.mp4",
            zona_cuerpo: item.zona_cuerpo || "General"
          }));
          setEjerciciosCatalogo(formateados);
        }
      })
      .catch(() => {});
  };

  const cargarDashboard = () => {
    fetch(`${API_URL}/dashboard/estadisticas`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setDashboardData(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    cargarPacientes();
    cargarEjercicios();
    cargarDashboard();
  }, []);

  // Cargar datos específicos del paciente activo
  useEffect(() => {
    if (!pacienteIdActivo) return;

    fetch(`${API_URL}/pacientes/${pacienteIdActivo}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setPaciente(data))
      .catch(() => setPaciente(null));

    fetch(`${API_URL}/pacientes/${pacienteIdActivo}/rutinas`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setRutinasHoy(Array.isArray(data) ? data : []))
      .catch(() => setRutinasHoy([]));

    fetch(`${API_URL}/pacientes/${pacienteIdActivo}/cardex`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setCardex(Array.isArray(data) ? data : []))
      .catch(() => setCardex([]));

    fetch(`${API_URL}/pacientes/${pacienteIdActivo}/feedback`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setFeedbackPaciente(Array.isArray(data) ? data : []))
      .catch(() => setFeedbackPaciente([]));
  }, [pacienteIdActivo]);

  // Manejo de búsqueda y selección de paciente
  const buscarPacientePorId = (e) => {
    e.preventDefault();
    if (idBuscado) {
      setPacienteIdActivo(idBuscado.toString());
    }
  };

  const seleccionarPacienteDirecto = (id) => {
    setIdBuscado(id.toString());
    setPacienteIdActivo(id.toString());
  };

  // Manejo de selección en catálogo de ejercicios
  const handleEjercicioSelect = (e) => {
    const id = Number(e.target.value);
    setSelectedEjercicioId(id);
    const ej = ejerciciosCatalogo.find(item => item.id === id);
    if (ej) {
      setFrecuenciaAsignar(ej.frecuenciaSugerida || "3 series de 10 repeticiones");
    }
  };

  const ejercicioSeleccionado = ejerciciosCatalogo.find(ex => ex.id === Number(selectedEjercicioId)) || ejerciciosCatalogo[0];

  // 1. REGISTRAR EVOLUCIÓN
  const guardarEvolucionCompleta = async (e) => {
    e.preventDefault();
    const notaFormateada = `[Estado: ${estadoBanner}] [Dolor: ${nivelDolor}/10] [Movilidad: ${rangoMovilidad}] - ${observaciones}`;

    try {
      const res = await fetch(`${API_URL}/pacientes/${pacienteIdActivo}/cardex`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: 1, notas_clinicas: notaFormateada })
      });

      if (res.ok) {
        mostrarNotificacion("✅ ¡Evolución registrada y sincronizada con el expediente del paciente!");
        setObservaciones("");
        const updatedCardex = await fetch(`${API_URL}/pacientes/${pacienteIdActivo}/cardex`).then(r => r.json());
        setCardex(Array.isArray(updatedCardex) ? updatedCardex : []);
      } else {
        mostrarNotificacion("Error al guardar la evolución. Verifica la conexión.", "error");
      }
    } catch (error) {
      mostrarNotificacion("Error de red al guardar la evolución.", "error");
    }
  };

  // 3. ASIGNAR EJERCICIO
  const asignarEjercicioDirecto = async (ejercicio, frecuencia) => {
    if (!ejercicio) return;
    try {
      const res = await fetch(`${API_URL}/pacientes/${pacienteIdActivo}/asignar-rutina`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ejercicio_id: ejercicio.id,
          frecuencia: frecuencia || ejercicio.frecuenciaSugerida || "3 series de 10 repeticiones"
        })
      });

      if (res.ok) {
        mostrarNotificacion(`🎉 ¡"${ejercicio.titulo}" asignado al paciente #${pacienteIdActivo} con éxito!`);
        const updated = await fetch(`${API_URL}/pacientes/${pacienteIdActivo}/rutinas`).then(r => r.json());
        setRutinasHoy(Array.isArray(updated) ? updated : []);
        cargarDashboard();
      } else {
        mostrarNotificacion("Error al asignar la rutina.", "error");
      }
    } catch (error) {
      mostrarNotificacion("Error de conexión al asignar rutina.", "error");
    }
  };

  // 4. REGISTRAR NUEVO PACIENTE
  const registrarPacienteBase = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/pacientes/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: nuevoNombre, 
          email: nuevoEmail, 
          password: nuevoPassword,
          identificacion: nuevaIdentificacion,
          datos_medicos_generales: nuevoDatosMedicos,
          alergias: nuevasAlergias,
          prescripciones_previas: nuevasPrescripciones,
          contraindicaciones: nuevasContraindicaciones,
          comentarios: nuevosComentarios
        })
      });
      if (res.ok) {
        const data = await res.json();
        mostrarNotificacion(`🎉 ¡Paciente creado con éxito! Expediente #${data.id}`);
        setIdBuscado(data.id.toString());
        setPacienteIdActivo(data.id.toString());
        setNuevoNombre("");
        setNuevoEmail("");
        setNuevaIdentificacion("");
        setNuevoDatosMedicos("");
        setNuevasAlergias("");
        setNuevasPrescripciones("");
        setNuevasContraindicaciones("");
        setNuevosComentarios("");
        setMostrarFormCrear(false);
        cargarPacientes();
        cargarDashboard();
      } else {
        mostrarNotificacion("Error al registrar paciente. Verifica los datos.", "error");
      }
    } catch (error) {
      mostrarNotificacion("Error de conexión al registrar paciente.", "error");
    }
  };

  // 5. AÑADIR NUEVO VIDEO/EJERCICIO AL CATÁLOGO
  const registrarNuevoEjercicioCatalogo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/ejercicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: nuevoVideoTitulo,
          descripcion: nuevoVideoDesc,
          url_video: nuevoVideoUrl,
          zona_cuerpo: nuevoVideoZona
        })
      });

      if (res.ok) {
        mostrarNotificacion(`🎉 ¡Video "${nuevoVideoTitulo}" añadido al catálogo médico con éxito!`);
        setNuevoVideoTitulo("");
        setNuevoVideoDesc("");
        cargarEjercicios();
        setPestañaActiva('expediente');
      } else {
        mostrarNotificacion("Error al registrar el nuevo ejercicio en la base de datos.", "error");
      }
    } catch (error) {
      mostrarNotificacion("Error de red al añadir el video.", "error");
    }
  };

  // Filtro de historial Cardex
  const cardexFiltrado = cardex.filter(item =>
    item.notas_clinicas.toLowerCase().includes(filtroHistorial.toLowerCase()) ||
    (item.fecha && item.fecha.toLowerCase().includes(filtroHistorial.toLowerCase()))
  );

  const hayAlertaUrgente = feedbackPaciente.some(fb => 
    fb.sensacion_dolor?.toLowerCase().includes('fuerte') || 
    fb.sensacion_dolor?.toLowerCase().includes('insoportable') ||
    fb.sensacion_dolor?.includes('8') || fb.sensacion_dolor?.includes('9') || 
    fb.sensacion_dolor?.includes('10') ||
    fb.comentario?.toLowerCase().includes('mucho dolor') ||
    fb.comentario?.toLowerCase().includes('me duele')
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 md:p-10 pb-28">

      {/* Notificación Flotante */}
      {notificacion.mensaje && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-2 animate-in slide-in-from-top-4 ${notificacion.tipo === 'error' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
          <span>{notificacion.tipo === 'error' ? '❌' : '✅'}</span>
          {notificacion.mensaje}
        </div>
      )}

      {/* Header Principal */}
      <header className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🩺</span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 tracking-tight">Portal Clínico del Médico</h1>
          </div>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Control integral de expedientes, asignación interactiva, historial Cardex y dashboard de cumplimiento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-xs px-4 py-3 rounded-2xl transition flex items-center gap-1.5 shadow-sm"
          >
            <span>←</span> Volver al Inicio
          </Link>
          <button
            onClick={() => setMostrarFormCrear(!mostrarFormCrear)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl transition shadow-lg cursor-pointer flex items-center gap-2 text-xs sm:text-sm"
          >
            {mostrarFormCrear ? '✕ Cerrar Registro' : '＋ Registrar Paciente Nuevo'}
          </button>
        </div>
      </header>

      {/* ALERTA TEMPRANA 🚨 */}
      {hayAlertaUrgente && pestañaActiva === 'expediente' && (
        <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl mb-8 flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚨</span>
            <div>
              <h4 className="font-extrabold text-red-400">¡Alerta Temprana de Dolor Severo!</h4>
              <p className="text-sm text-red-200">El paciente actual ha reportado altos niveles de dolor recientemente. Por favor revisa sus notas y ajusta las rutinas de inmediato.</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. FORMULARIO REGISTRAR NUEVO PACIENTE (Colapsable) */}
      {mostrarFormCrear && (
        <form onSubmit={registrarPacienteBase} className="bg-white border border-emerald-500/50 p-6 sm:p-8 rounded-3xl shadow-2xl mb-8 space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-teal-700 flex items-center gap-2">
              📝 Formulario Base de Registro de Paciente
            </h3>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full font-bold">
              Base de Datos SQL
            </span>
          </div>
          <p className="text-sm text-slate-500">Ingresa los datos del paciente para generar su expediente y credenciales de acceso automático.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-bold">NOMBRE COMPLETO:</label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej. Roberto Gómez"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-bold">CORREO ELECTRÓNICO:</label>
              <input
                type="email"
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                placeholder="roberto@correo.com"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-bold">CONTRASEÑA INICIAL:</label>
              <input
                type="text"
                value={nuevoPassword}
                onChange={(e) => setNuevoPassword(e.target.value)}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-bold">IDENTIFICACIÓN (ID):</label>
              <input
                type="text"
                value={nuevaIdentificacion}
                onChange={(e) => setNuevaIdentificacion(e.target.value)}
                placeholder="Ej. 12345678"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-600 mb-1 font-bold">DATOS MÉDICOS GENERALES:</label>
              <input
                type="text"
                value={nuevoDatosMedicos}
                onChange={(e) => setNuevoDatosMedicos(e.target.value)}
                placeholder="Enfermedades crónicas, estado general..."
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-bold">ALERGIAS:</label>
              <input
                type="text"
                value={nuevasAlergias}
                onChange={(e) => setNuevasAlergias(e.target.value)}
                placeholder="Ej. Penicilina, látex..."
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-bold">PRESCRIPCIONES PREVIAS:</label>
              <input
                type="text"
                value={nuevasPrescripciones}
                onChange={(e) => setNuevasPrescripciones(e.target.value)}
                placeholder="Medicamentos actuales"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-bold">CONTRAINDICACIONES:</label>
              <input
                type="text"
                value={nuevasContraindicaciones}
                onChange={(e) => setNuevasContraindicaciones(e.target.value)}
                placeholder="Movimientos a evitar"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-xs text-slate-600 mb-1 font-bold">COMENTARIOS ADICIONALES:</label>
              <textarea
                value={nuevosComentarios}
                onChange={(e) => setNuevosComentarios(e.target.value)}
                placeholder="Observaciones de conducta, acompañantes..."
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-emerald-500 resize-none h-20"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-extrabold py-3.5 rounded-xl transition shadow-lg cursor-pointer text-sm">
            Guardar Paciente y Crear Expediente
          </button>
        </form>
      )}

      {/* 2. FILTRAR PACIENTE Y BARRA DE GESTIÓN RÁPIDA */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Buscador ID */}
            <form onSubmit={buscarPacientePorId} className="flex items-center gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-bold">FILTRAR POR ID:</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={idBuscado}
                    onChange={(e) => setIdBuscado(e.target.value)}
                    className="bg-slate-100 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-800 w-28 focus:outline-none focus:border-blue-500 font-bold text-center text-base"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition cursor-pointer text-sm">
                    Buscar
                  </button>
                </div>
              </div>
            </form>

            {/* Selector desplegable de todos los pacientes */}
            {pacientesLista.length > 0 && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] text-slate-500 mb-1 font-bold">LISTA DE PACIENTES ({pacientesLista.length}):</label>
                <select
                  value={pacienteIdActivo}
                  onChange={(e) => seleccionarPacienteDirecto(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-semibold text-sm cursor-pointer focus:outline-none focus:border-blue-500"
                >
                  {pacientesLista.map(p => (
                    <option key={p.id} value={p.id}>
                      ID #{p.id} - {p.nombre} ({p.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Ficha Resumen del Paciente Activo */}
          <div className="bg-slate-100/80 border border-slate-300/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 w-full lg:w-auto">
            <div>
              <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">Paciente en Gestión Activa:</span>
              <span className="text-lg font-extrabold text-teal-700 block">
                {paciente ? `${paciente.nombre} (ID: ${paciente.id})` : "⚠️ Paciente no encontrado"}
              </span>
              {paciente && <span className="text-xs text-slate-500">{paciente.email}</span>}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMostrarQrModal(true)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-600 transition cursor-pointer flex items-center gap-1.5"
                title="Ver código QR de acceso para el paciente"
              >
                📱 Ver QR
              </button>
              <a
                href={`/paciente/${pacienteIdActivo}`}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                ↗ Abrir Vista Paciente
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Código QR */}
      {mostrarQrModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-300 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center">
            <h3 className="text-lg font-bold text-slate-800">📱 Código QR del Paciente</h3>
            <p className="text-xs text-slate-500">Escanea este código con la cámara del celular para abrir el portal de ejercicios del paciente #{pacienteIdActivo}:</p>
            <div className="bg-white p-4 rounded-2xl flex justify-center shadow-inner">
              <img
                src={`${API_URL}/pacientes/${pacienteIdActivo}/qr?base_url=${encodeURIComponent(window.location.origin)}`}
                alt="QR Paciente"
                className="w-48 h-48 object-contain"
              />
            </div>
            <button
              onClick={() => setMostrarQrModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-700 text-slate-800 font-bold py-2.5 rounded-xl text-sm transition cursor-pointer"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}

      {/* Barra de Pestañas de las 7 Funcionalidades */}
      <nav className="flex flex-wrap gap-2 mb-8 bg-white/90 border border-slate-200 p-2 rounded-2xl">
        <button
          onClick={() => setPestañaActiva('expediente')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
            pestañaActiva === 'expediente'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <span>🏋️</span> Asignar Ejercicios & Progreso
        </button>

        <button
          onClick={() => setPestañaActiva('evolucion')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
            pestañaActiva === 'evolucion'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <span>📋</span> Evolución & Historial Cardex
        </button>

        <button
          onClick={() => setPestañaActiva('dashboard')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
            pestañaActiva === 'dashboard'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <span>📊</span> Dashboard de Cumplimiento
        </button>

        <button
          onClick={() => setPestañaActiva('catalogo')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
            pestañaActiva === 'catalogo'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <span>🎬</span> Añadir Nuevo Video al Catálogo
        </button>
      </nav>

      {/* CONTENIDO DE LAS PESTAÑAS */}

      {/* PESTAÑA 1: ASIGNACIÓN DE EJERCICIOS Y PROGRESO DE HOY */}
      {pestañaActiva === 'expediente' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3. ASIGNACIÓN INTERACTIVA POR LISTA DESPLEGABLE */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            <div>
              <h3 className="text-2xl font-extrabold text-blue-800 flex items-center gap-2">
                🏋️ Asignación de Ejercicios Interactivos
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Selecciona un ejercicio de la lista desplegable conectada al catálogo para asignárselo de inmediato al paciente #{pacienteIdActivo}:
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                  Lista Desplegable de Ejercicios Disponibles ({ejerciciosCatalogo.length}):
                </label>
                <select
                  value={selectedEjercicioId}
                  onChange={handleEjercicioSelect}
                  className="w-full bg-slate-100 border border-blue-500/50 rounded-2xl p-4 text-slate-800 font-bold text-base focus:outline-none focus:border-blue-400 cursor-pointer shadow-inner"
                >
                  {ejerciciosCatalogo.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.id}. {ex.titulo} - Zona: {ex.zona_cuerpo || "General"}
                    </option>
                  ))}
                </select>
              </div>

              {ejercicioSeleccionado && (
                <div className="bg-slate-100/80 border border-slate-300 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-lg">{ejercicioSeleccionado.titulo}</h4>
                      <span className="text-xs text-blue-300 font-semibold bg-blue-950/80 border border-blue-800 px-2.5 py-0.5 rounded-full inline-block mt-1">
                        Zona: {ejercicioSeleccionado.zona_cuerpo || "General"}
                      </span>
                    </div>
                    <span className="text-xs bg-slate-700 text-slate-600 px-3 py-1 rounded-xl font-bold">
                      ID Catálogo #{ejercicioSeleccionado.id}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed bg-white/60 p-4 rounded-xl border border-slate-300/50">
                    {ejercicioSeleccionado.descripcion}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 font-bold">Frecuencia / Series sugeridas:</label>
                      <input
                        type="text"
                        value={frecuenciaAsignar}
                        onChange={(e) => setFrecuenciaAsignar(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                        placeholder="Ej. 3 series de 10 repeticiones"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 font-bold">Ruta del Video Asociado:</label>
                      <input
                        type="text"
                        value={ejercicioSeleccionado.url_video || ""}
                        readOnly
                        className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl p-3 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => asignarEjercicioDirecto(ejercicioSeleccionado, frecuenciaAsignar)}
                    className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-800 font-extrabold py-4 rounded-xl transition text-base cursor-pointer shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>+</span> Asignar "{ejercicioSeleccionado.titulo}" a este Paciente
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PROGRESO EN VIVO HOY */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-teal-700">📊 Progreso de Hoy</h3>
                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-bold">
                  {rutinasHoy.filter(r => r.completado_hoy).length}/{rutinasHoy.length} hechos
                </span>
              </div>

              <div className="space-y-3">
                {rutinasHoy.length === 0 ? (
                  <p className="text-slate-500 text-sm italic py-4 text-center">No tiene rutinas asignadas hoy.</p>
                ) : (
                  rutinasHoy.map((r) => (
                    <div key={r.id} className="bg-slate-100/90 p-4 rounded-2xl flex justify-between items-center border border-slate-300/60 shadow">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{r.ejercicio?.titulo || "Ejercicio"}</h4>
                        <span className="text-xs text-slate-500 block mt-0.5">{r.frecuencia}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${r.completado_hoy ? 'bg-emerald-500/20 text-teal-700 border border-emerald-500/40' : 'bg-blue-500/20 text-teal-400 border border-teal-500/40'}`}>
                        {r.completado_hoy ? 'Hecho ✅' : 'Pendiente ⏱️'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Hoja Resumen de Tratamiento */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider">📋 Hoja de Tratamiento Activo</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                El paciente tiene un plan activo de rehabilitación. Asegúrate de verificar su nivel de dolor antes de incrementar la dificultad o carga de ejercicios.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setPestañaActiva('evolucion')}
                  className="w-full bg-slate-100 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 rounded-xl border border-slate-300 transition cursor-pointer"
                >
                  Registrar Nota en Cardex ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: 1. REGISTRAR EVOLUCIÓN Y 6. HISTORIAL CARDEX */}
      {pestañaActiva === 'evolucion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. REGISTRAR EVOLUCIÓN ESTRUCTURADA */}
          <form onSubmit={guardarEvolucionCompleta} className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            <div>
              <h3 className="text-2xl font-extrabold text-teal-700 flex items-center gap-2">
                📝 Registrar Evolución y Actualizar Estado
              </h3>
              <p className="text-xs text-slate-500 mt-1">Registra la sesión de hoy en el expediente Cardex del paciente #{pacienteIdActivo}:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-bold">BANDERA CLÍNICA:</label>
                <select
                  value={estadoBanner}
                  onChange={(e) => setEstadoBanner(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 font-bold text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="Estable 🟢">Estable 🟢</option>
                  <option value="En Observación 🟡">En Observación 🟡</option>
                  <option value="Requiere Ajuste 🔴">Requiere Ajuste 🔴</option>
                  <option value="Alta Médica 🔵">Alta Médica 🔵</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-bold">NIVEL DOLOR (1-10):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="1" max="10"
                    value={nivelDolor}
                    onChange={(e) => setNivelDolor(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 font-bold text-center text-sm"
                  />
                  <span className="text-xl">
                    {nivelDolor <= 3 ? '🟢' : nivelDolor <= 6 ? '🟡' : '🔴'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-bold">MOVILIDAD:</label>
                <select
                  value={rangoMovilidad}
                  onChange={(e) => setRangoMovilidad(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 font-bold text-sm"
                >
                  <option value="Completo/Fluido">Completo / Fluido</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Limitado">Limitado</option>
                  <option value="Con Dolor">Con Dolor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1 font-bold">NOTAS CLÍNICAS Y EVOLUCIÓN DEL DÍA:</label>
              <textarea
                rows="4"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Describe el progreso del paciente, tolerancia a los videos y recomendaciones de recuperación..."
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-4 text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
                required
              ></textarea>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-extrabold text-base py-4 rounded-xl transition shadow-xl cursor-pointer">
              Guardar Evolución en Base de Datos
            </button>
          </form>

          {/* 6. REVISAR HISTORIAL CARDEX Y OPINIONES DEL PACIENTE */}
          <div className="space-y-6">
            {/* Historial Cardex */}
            <div id="historia-clinica-pdf" className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-extrabold text-blue-300 flex items-center gap-2">
                  📋 Historial Clínico (Cardex)
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-bold">
                    {cardex.length} registros
                  </span>
                  <button 
                    onClick={descargarPDF} 
                    disabled={isPdfLoading}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 shadow-md ${isPdfLoading ? 'bg-slate-600 text-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'}`}
                  >
                    {isPdfLoading ? '⏳ Generando...' : '⬇️ Descargar PDF'}
                  </button>
                </div>
              </div>

              {/* Datos Médicos del Paciente */}
              {paciente && (
                <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-300/50 space-y-2 mb-4 text-xs text-slate-600">
                  <h4 className="font-bold text-slate-800 mb-2 text-sm uppercase">Perfil Médico del Paciente</h4>
                  <p><strong className="text-blue-300">Nombre:</strong> {paciente.nombre} | <strong className="text-blue-300">ID/Cédula:</strong> {paciente.identificacion || 'N/A'}</p>
                  <p><strong className="text-blue-300">Datos Generales:</strong> {paciente.datos_medicos_generales || 'Ninguno registrado'}</p>
                  <p><strong className="text-blue-300">Alergias:</strong> {paciente.alergias || 'Ninguna registrada'}</p>
                  <p><strong className="text-blue-300">Prescripciones:</strong> {paciente.prescripciones_previas || 'Ninguna'}</p>
                  <p><strong className="text-blue-300">Contraindicaciones:</strong> {paciente.contraindicaciones || 'Ninguna'}</p>
                  <p><strong className="text-blue-300">Comentarios:</strong> {paciente.comentarios || 'Sin observaciones'}</p>
                </div>
              )}

              {/* Buscador en el historial */}
              <input
                type="text"
                value={filtroHistorial}
                onChange={(e) => setFiltroHistorial(e.target.value)}
                placeholder="🔍 Filtrar notas del historial..."
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />

              <div id="historial-scroll-container" className={`space-y-3 pr-2 ${isPdfLoading ? '' : 'max-h-[380px] overflow-y-auto'}`}>
                {cardexFiltrado.length === 0 ? (
                  <p className="text-slate-500 text-sm italic py-4 text-center">Sin registros en el Cardex para este paciente.</p>
                ) : (
                  cardexFiltrado.map((item, idx) => (
                    <div key={idx} className="bg-slate-100/90 border-l-4 border-blue-500 p-4 rounded-2xl space-y-1 shadow">
                      <div className="flex justify-between items-center text-xs text-blue-800 font-semibold">
                        <span>Consulta #{item.id || idx + 1}</span>
                        <span>{item.fecha ? new Date(item.fecha).toLocaleDateString() : 'Hoy'}</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words">{item.notas_clinicas}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Opiniones y Mensajes Enviados por el Paciente */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                💬 Opiniones y Feedback Recibido del Paciente ({feedbackPaciente.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {feedbackPaciente.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">El paciente aún no ha enviado comentarios u opiniones.</p>
                ) : (
                  feedbackPaciente.map((fb, idx) => (
                    <div key={idx} className="bg-slate-100/70 p-3 rounded-xl border border-slate-300/50 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-teal-400">{fb.sensacion_dolor || "Reporte"}</span>
                        <span className="text-[11px] text-slate-500">{fb.fecha ? new Date(fb.fecha).toLocaleDateString() : 'Reciente'}</span>
                      </div>
                      <p className="text-xs text-slate-600 italic">"{fb.comentario}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: 7. DASHBOARD DE EJERCICIOS Y CUMPLIMIENTO */}
      {pestañaActiva === 'dashboard' && (
        <div className="space-y-8">
          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pacientes</span>
              <div className="text-3xl font-extrabold text-slate-800 mt-2 flex items-center justify-between">
                <span>{dashboardData.total_pacientes}</span>
                <span className="text-2xl">👥</span>
              </div>
              <span className="text-xs text-teal-700 mt-2 block">Registrados en el sistema</span>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Rutinas Asignadas Hoy</span>
              <div className="text-3xl font-extrabold text-blue-800 mt-2 flex items-center justify-between">
                <span>{dashboardData.total_rutinas}</span>
                <span className="text-2xl">📋</span>
              </div>
              <span className="text-xs text-slate-500 mt-2 block">En todos los pacientes</span>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ejercicios Realizados</span>
              <div className="text-3xl font-extrabold text-teal-700 mt-2 flex items-center justify-between">
                <span>{dashboardData.completadas}</span>
                <span className="text-2xl">✅</span>
              </div>
              <span className="text-xs text-slate-500 mt-2 block">Pendientes: {dashboardData.pendientes}</span>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tasa de Adherencia</span>
              <div className="text-3xl font-extrabold text-indigo-400 mt-2 flex items-center justify-between">
                <span>{dashboardData.tasa_adherencia}%</span>
                <span className="text-2xl">📈</span>
              </div>
              <span className="text-xs text-indigo-300 mt-2 block">Cumplimiento terapéutico</span>
            </div>
          </div>

          {/* Gráfico de Adherencia (Recharts) */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-xl font-extrabold text-indigo-400">📈 Gráfico de Adherencia por Paciente</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.pacientes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="nombre" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                  <Bar dataKey="total_rutinas" name="Rutinas Asignadas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completadas" name="Rutinas Completadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla de Seguimiento de Pacientes */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                📊 Monitoreo de Cumplimiento por Paciente
              </h3>
              <button
                onClick={cargarDashboard}
                className="bg-slate-100 hover:bg-slate-700 text-xs text-slate-600 px-3 py-1.5 rounded-xl border border-slate-300 transition cursor-pointer"
              >
                🔄 Actualizar Métricas
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-xs uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">ID</th>
                    <th className="p-3.5">Paciente</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Rutinas Asignadas</th>
                    <th className="p-3.5">Completadas Hoy</th>
                    <th className="p-3.5 rounded-r-xl">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {dashboardData.pacientes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-slate-500 italic">No hay pacientes registrados.</td>
                    </tr>
                  ) : (
                    dashboardData.pacientes.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-100/40 transition">
                        <td className="p-3.5 font-bold text-blue-800">#{p.id}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{p.nombre}</td>
                        <td className="p-3.5 text-xs text-slate-500">{p.email}</td>
                        <td className="p-3.5 font-bold">{p.total_rutinas}</td>
                        <td className="p-3.5 font-bold text-teal-700">{p.completadas}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => {
                              seleccionarPacienteDirecto(p.id);
                              setPestañaActiva('expediente');
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                              p.al_dia
                                ? 'bg-emerald-500/20 text-teal-700 hover:bg-blue-700/30'
                                : p.total_rutinas === 0
                                ? 'bg-slate-700 text-slate-600 hover:bg-slate-600'
                                : 'bg-blue-500/20 text-teal-400 hover:bg-blue-500/30'
                            }`}
                          >
                            {p.al_dia ? 'Al día ✅' : p.total_rutinas === 0 ? 'Sin Rutinas ＋' : 'Pendiente ⏱️'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: 5. AÑADIR NUEVO VIDEO INTERACTIVO AL CATÁLOGO */}
      {pestañaActiva === 'catalogo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario para registrar nuevo video */}
          <form onSubmit={registrarNuevoEjercicioCatalogo} className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-2xl font-extrabold text-blue-800 flex items-center gap-2">
              🎬 Añadir Nuevo Video Interactivo al Catálogo
            </h3>
            <p className="text-xs text-slate-500">
              Registra un nuevo ejercicio o video en la base de datos para que quede disponible inmediatamente en la lista desplegable de asignación médica:
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">TÍTULO DEL EJERCICIO:</label>
              <input
                type="text"
                value={nuevoVideoTitulo}
                onChange={(e) => setNuevoVideoTitulo(e.target.value)}
                placeholder="Ej. Flexión de Hombro con Banda"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ZONA DEL CUERPO / ARTICULACIÓN:</label>
              <select
                value={nuevoVideoZona}
                onChange={(e) => setNuevoVideoZona(e.target.value)}
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="Pierna">Pierna / Rodilla</option>
                <option value="Hombro">Hombro / Brazo</option>
                <option value="Espalda">Espalda / Columna</option>
                <option value="Cadera">Cadera</option>
                <option value="General">Cardiovascular / General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">DESCRIPCIÓN CLÍNICA Y BENEFICIOS:</label>
              <textarea
                rows="3"
                value={nuevoVideoDesc}
                onChange={(e) => setNuevoVideoDesc(e.target.value)}
                placeholder="Describe el objetivo terapéutico, músculos trabajados y técnica correcta..."
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">RUTA O ENLACE DEL VIDEO MP4:</label>
              <input
                type="text"
                value={nuevoVideoUrl}
                onChange={(e) => setNuevoVideoUrl(e.target.value)}
                placeholder="Ej. /videos/rodilla.mp4 o URL externa"
                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:border-blue-500 font-mono text-xs"
                required
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-extrabold text-base py-4 rounded-xl transition shadow-xl cursor-pointer">
              Guardar en Catálogo Médico
            </button>
          </form>

          {/* Biblioteca actual de videos */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-xl font-extrabold text-teal-700">
              📚 Biblioteca Actual de Videos ({ejerciciosCatalogo.length})
            </h3>
            <p className="text-xs text-slate-500">Ejercicios disponibles en la base de datos de la plataforma:</p>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
              {ejerciciosCatalogo.map((ex) => (
                <div key={ex.id} className="bg-slate-100/90 border border-slate-300 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-base">{ex.titulo}</h4>
                    <span className="text-xs bg-blue-950 text-blue-300 px-2.5 py-0.5 rounded-full font-bold">
                      {ex.zona_cuerpo || "General"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{ex.descripcion}</p>
                  <span className="text-[11px] text-slate-500 font-mono block">Video: {ex.url_video}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}