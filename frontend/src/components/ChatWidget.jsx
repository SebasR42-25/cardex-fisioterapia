import { useState, useRef, useEffect } from 'react';

let messageCounter = 10;

function generarId() {
  messageCounter += 1;
  return messageCounter;
}

function getHoraActual() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([
    {
      id: 1,
      remitente: 'bot',
      texto: '👋 ¡Hola! Soy tu Asistente Virtual de Cardex Fisioterapia. ¿Tienes alguna duda sobre tus ejercicios, dolor o indicaciones médicas?',
      hora: getHoraActual()
    }
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const finMensajesRef = useRef(null);

  const chipsPreguntas = [
    { label: '🚨 ¿Qué hacer si siento dolor?', texto: 'Siento dolor al hacer el ejercicio' },
    { label: '🦵 Ejercicio de Rodilla', texto: '¿Cómo hacer la extensión de rodilla?' },
    { label: '🚶 Caminata Segura', texto: 'Consejos para la caminata' },
    { label: '👨‍⚕️ Contactar al Doctor', texto: '¿Cómo le escribo a mi médico?' },
    { label: '💊 Mis Medicamentos', texto: '¿Puedo tomar mis medicinas antes de la rutina?' },
    { label: '⏰ Horarios Ideales', texto: '¿Cuál es la mejor hora para hacer los ejercicios?' }
  ];

  const scrollAlFinal = () => {
    finMensajesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (abierto) {
      scrollAlFinal();
    }
  }, [mensajes, abierto]);

  const procesarRespuesta = (pregunta) => {
    const q = pregunta.toLowerCase();

    if (q.includes('dolor') || q.includes('duele') || q.includes('molestia') || q.includes('lastima') || q.includes('punzada')) {
      return '🚨 **Protocolo ante dolor:** Si el dolor supera el nivel 5 de 10 o sientes punzadas agudas, suspende el ejercicio de inmediato. Aplica compresas frías por 10-15 minutos si hay inflamación y deja un mensaje en la sección de opiniones para que tu doctor lo revise.';
    }
    if (q.includes('rodilla') || q.includes('pierna') || q.includes('cuadriceps') || q.includes('articulaci')) {
      return '🦵 **Cuidado de rodilla:** Realiza las extensiones con movimientos lentos y controlados, sentándote con la espalda recta. No bloquees bruscamente la articulación. Si sientes crujido con dolor, reduce el ángulo de elevación.';
    }
    if (q.includes('caminata') || q.includes('cardio') || q.includes('caminar') || q.includes('paso')) {
      return '🚶 **Pautas de caminata estática:** Mantén la espalda erguida, usa calzado deportivo cómodo con suela antideslizante. Respira a un ritmo constante. 5 minutos continuos sin prisa son ideales para activar la circulación en piernas.';
    }
    if (q.includes('doctor') || q.includes('medico') || q.includes('médico') || q.includes('cita') || q.includes('contacto') || q.includes('escribir') || q.includes('mensaje')) {
      return '👨‍⚕️ **Comunicación con tu especialista:** Tu médico revisa diariamente tu Cardex y el progreso de tus ejercicios. Puedes enviarle notas directas y reportar tu nivel de dolor desde la sección inferior de **Opiniones y Mensajes al Doctor**.';
    }
    if (q.includes('video') || q.includes('reproducir') || q.includes('pantalla') || q.includes('ver') || q.includes('cómo')) {
      return '▶️ **Reproducción de videos:** Haz clic en el botón **"▶ Ver Video"** en cualquiera de tus ejercicios asignados. El reproductor amplio se abrirá arriba. Puedes pausarlo o verlo tantas veces como desees.';
    }
    if (q.includes('cansan') || q.includes('fatiga') || q.includes('agotad') || q.includes('cansad')) {
      return '💧 **Manejo de fatiga:** Es completamente normal sentir esfuerzo muscular moderado, pero no agotamiento excesivo. Descansa 1 o 2 minutos entre repeticiones e hidrátate con pequeños sorbos de agua.';
    }
    if (q.includes('medicina') || q.includes('medicamento') || q.includes('pastilla')) {
      return '💊 **Medicamentos:** Sí, puedes tomar tu medicación habitual según te haya recetado el médico general. Te sugiero esperar unos 30 minutos después de comer o tomar pastillas antes de iniciar la rutina física.';
    }
    if (q.includes('hora') || q.includes('cuando') || q.includes('cuándo') || q.includes('horario') || q.includes('mejor momento')) {
      return '⏰ **Horarios Ideales:** Te recomendamos hacer tus ejercicios por la mañana (después del desayuno) o a media tarde, evitando las horas de más calor y no muy cerca de la hora de dormir, para que puedas descansar adecuadamente.';
    }
    if (q.includes('hola') || q.includes('buenos') || q.includes('buenas') || q.includes('saludos') || q.includes('inicio') || q.includes('ayuda')) {
      return '👋 **¡Hola! Estoy para servirte.** Puedes preguntarme sobre técnicas de ejercicio, qué hacer si sientes molestia, cómo ver tus videos o cómo enviar notas a tu médico.';
    }

    return '🤖 **Asistente Cardex:** He recibido tu consulta. Para recomendaciones específicas sobre tu tratamiento, revisa las notas de tu médico en la parte superior o pregúntame sobre: **dolor**, **rodilla**, **caminata**, **horarios** o **cómo ver videos**.';
  };

  const enviarMensaje = (textoAEnviar) => {
    const texto = textoAEnviar || inputTexto;
    if (!texto.trim()) return;

    const nuevoMsgUsuario = {
      id: generarId(),
      remitente: 'usuario',
      texto: texto.trim(),
      hora: getHoraActual()
    };

    setMensajes((prev) => [...prev, nuevoMsgUsuario]);
    if (!textoAEnviar) setInputTexto('');
    setEscribiendo(true);

    setTimeout(() => {
      const respuesta = procesarRespuesta(texto);
      const nuevoMsgBot = {
        id: generarId(),
        remitente: 'bot',
        texto: respuesta,
        hora: getHoraActual()
      };
      setMensajes((prev) => [...prev, nuevoMsgBot]);
      setEscribiendo(false);
    }, 450);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    enviarMensaje();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Ventana de Chat */}
      {abierto && (
        <div className="bg-slate-900 border border-slate-700 w-[90vw] sm:w-[380px] h-[520px] rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5">
          {/* Header del Chat */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 text-white flex justify-between items-center shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-900/80 border border-blue-400 flex items-center justify-center text-xl shadow-inner">
                🤖
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-tight">Asistente Fisioterapia</h4>
                <span className="text-[11px] text-blue-200 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  En línea para ayudarte
                </span>
              </div>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
              title="Cerrar chat"
            >
              ✕
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/80">
            {mensajes.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.remitente === 'usuario' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.remitente === 'usuario'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md font-medium'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-bl-none shadow'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.texto}</p>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.hora}</span>
              </div>
            ))}

            {escribiendo && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 p-2.5 rounded-2xl w-24 border border-slate-700/50">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce [animation-delay:0.2s]">●</span>
                <span className="animate-bounce [animation-delay:0.4s]">●</span>
              </div>
            )}
            <div ref={finMensajesRef} />
          </div>

          {/* Chips de Preguntas Frecuentes */}
          <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 overflow-x-auto flex gap-1.5 scrollbar-thin">
            {chipsPreguntas.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => enviarMensaje(chip.texto)}
                className="whitespace-nowrap text-[11px] font-semibold bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition shadow-sm cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input de Envío */}
          <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              placeholder="Escribe tu duda aquí..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition shadow cursor-pointer text-xs sm:text-sm"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Botón Flotante de Activación */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold px-5 py-3.5 rounded-full shadow-2xl border-2 border-blue-400/40 transition hover:scale-105 cursor-pointer"
      >
        <span className="text-xl">💬</span>
        <span className="text-sm tracking-wide">{abierto ? 'Cerrar Chat' : 'Ayuda / Chat Fisioterapia'}</span>
        {!abierto && (
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        )}
      </button>
    </div>
  );
}
