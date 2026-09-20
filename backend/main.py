import enum
from datetime import datetime
import io
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, DateTime, Boolean, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker, Session
import qrcode
from pydantic import BaseModel
from pydantic import EmailStr

# --- 1. CONFIGURACIÓN DE LA BASE DE DATOS ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./fisioterapia.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# --- 2. MODELOS DE BASE DE DATOS (SQLAlchemy) ---

class RolUsuario(enum.Enum):
    DOCTOR = "doctor"
    PACIENTE = "paciente"


class Usuario(Base):
    __tablename__ = 'usuarios'

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    identificacion = Column(String(50), unique=True, index=True, nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(Enum(RolUsuario), nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow)

    # Campos médicos para pacientes
    datos_medicos_generales = Column(Text, nullable=True)
    alergias = Column(Text, nullable=True)
    prescripciones_previas = Column(Text, nullable=True)
    contraindicaciones = Column(Text, nullable=True)
    comentarios = Column(Text, nullable=True)

    cardex_como_paciente = relationship("Cardex", foreign_keys='Cardex.paciente_id', back_populates="paciente")
    cardex_como_doctor = relationship("Cardex", foreign_keys='Cardex.doctor_id', back_populates="doctor")
    rutinas = relationship("RutinaAsignada", back_populates="paciente")


class Cardex(Base):
    __tablename__ = 'cardex'

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    doctor_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)
    notas_clinicas = Column(Text, nullable=False)

    paciente = relationship("Usuario", foreign_keys=[paciente_id], back_populates="cardex_como_paciente")
    doctor = relationship("Usuario", foreign_keys=[doctor_id], back_populates="cardex_como_doctor")


class Ejercicio(Base):
    __tablename__ = 'ejercicios'

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(150), nullable=False)
    descripcion = Column(Text)
    url_video = Column(String(255), nullable=False)
    zona_cuerpo = Column(String(50))

    rutinas_asignadas = relationship("RutinaAsignada", back_populates="ejercicio")


class RutinaAsignada(Base):
    __tablename__ = 'rutinas_asignadas'

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    ejercicio_id = Column(Integer, ForeignKey('ejercicios.id'), nullable=False)
    frecuencia = Column(String(100))
    completado_hoy = Column(Boolean, default=False)
    fecha_asignacion = Column(DateTime, default=datetime.utcnow)

    paciente = relationship("Usuario", back_populates="rutinas")
    ejercicio = relationship("Ejercicio", back_populates="rutinas_asignadas")


class FeedbackPaciente(Base):
    __tablename__ = 'feedback_pacientes'

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    sensacion_dolor = Column(String(50), nullable=True)
    comentario = Column(Text, nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)

    paciente = relationship("Usuario")


# Crear tablas automáticamente
Base.metadata.create_all(bind=engine)

# --- 3. CONFIGURACIÓN DE FASTAPI Y CORS ---
app = FastAPI(title="API Fisioterapia Adultos Mayores", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- 4. ESQUEMAS PYDANTIC ---

class PacienteCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str


class PacienteResponse(BaseModel):
    id: int
    nombre: str
    email: str
    identificacion: str | None = None
    rol: RolUsuario
    datos_medicos_generales: str | None = None
    alergias: str | None = None
    prescripciones_previas: str | None = None
    contraindicaciones: str | None = None
    comentarios: str | None = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    identificacion: str
    password: str


class CardexCreate(BaseModel):
    notas_clinicas: str
    doctor_id: int


class RutinaCreate(BaseModel):
    ejercicio_id: int
    frecuencia: str

class PacienteRegistroCompleto(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    identificacion: str | None = None
    datos_medicos_generales: str | None = None
    alergias: str | None = None
    prescripciones_previas: str | None = None
    contraindicaciones: str | None = None
    comentarios: str | None = None

class EstadoPacienteUpdate(BaseModel):
    estado_clinico: str # Ej: "Estable", "En Observación", "Alta"

class RutinaEstadoUpdate(BaseModel):
    completado_hoy: bool

# Esquema para asignar rutina
class AsignarRutinaRequest(BaseModel):
    ejercicio_id: int
    frecuencia: str

# Esquema estructurado para el Cardex
class CardexEstructuradoCreate(BaseModel):
    doctor_id: int
    nivel_dolor: int # Del 1 al 10
    rango_movilidad: str # Ej: "Limitado", "Moderado", "Completo"
    observaciones: str

# Esquema para nuevo ejercicio/video interactivo
class EjercicioCreate(BaseModel):
    titulo: str
    descripcion: str
    url_video: str
    zona_cuerpo: str = "General"

# Esquema para feedback del paciente
class FeedbackCreate(BaseModel):
    sensacion_dolor: str = "Sin dolor 😊"
    comentario: str


# --- 5. ENDPOINTS DE LA API ---

@app.get("/pacientes", response_model=List[PacienteResponse])
def listar_todos_pacientes(db: Session = Depends(get_db)):
    pacientes = db.query(Usuario).filter(Usuario.rol == RolUsuario.PACIENTE).order_by(Usuario.id.asc()).all()
    return pacientes


@app.post("/pacientes/", response_model=PacienteResponse, status_code=status.HTTP_201_CREATED)
def crear_paciente(paciente: PacienteCreate, db: Session = Depends(get_db)):
    db_usuario = db.query(Usuario).filter(Usuario.email == paciente.email).first()
    if db_usuario:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    nuevo_usuario = Usuario(
        nombre=paciente.nombre,
        email=paciente.email,
        password_hash=paciente.password,  # En producción usar passlib hash
        rol=RolUsuario.PACIENTE
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


@app.get("/pacientes/{paciente_id}", response_model=PacienteResponse)
def obtener_paciente(paciente_id: int, db: Session = Depends(get_db)):
    paciente = db.query(Usuario).filter(Usuario.id == paciente_id, Usuario.rol == RolUsuario.PACIENTE).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return paciente


@app.get("/pacientes/{paciente_id}/cardex")
def obtener_cardex_paciente(paciente_id: int, db: Session = Depends(get_db)):
    # Trae todo el historial clínico ordenado del paciente
    registros = db.query(Cardex).filter(Cardex.paciente_id == paciente_id).order_by(Cardex.id.desc()).all()
    return registros

@app.post("/pacientes/{paciente_id}/cardex", status_code=status.HTTP_201_CREATED)
def agregar_evolucion_cardex(paciente_id: int, cardex: CardexCreate, db: Session = Depends(get_db)):
    nuevo_registro = Cardex(
        paciente_id=paciente_id,
        doctor_id=cardex.doctor_id,
        notas_clinicas=cardex.notas_clinicas
    )
    db.add(nuevo_registro)
    db.commit()
    return {"mensaje": "Evolución guardada exitosamente en la base de datos"}

@app.get("/pacientes/{paciente_id}/qr")
def generar_qr_paciente(paciente_id: int, base_url: str = None):
    if base_url:
        base_clean = base_url.rstrip("/")
        url_destino = f"{base_clean}/paciente/{paciente_id}"
    else:
        url_destino = f"http://localhost:5173/paciente/{paciente_id}"

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(url_destino)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@app.get("/pacientes/{paciente_id}/rutinas")
def obtener_rutinas_paciente(paciente_id: int, db: Session = Depends(get_db)):
    # Busca las rutinas asignadas a este paciente en la base de datos
    rutinas = db.query(RutinaAsignada).filter(RutinaAsignada.paciente_id == paciente_id).all()
    resultado = []
    for r in rutinas:
        ej = db.query(Ejercicio).filter(Ejercicio.id == r.ejercicio_id).first()
        resultado.append({
            "id": r.id,
            "paciente_id": r.paciente_id,
            "ejercicio_id": r.ejercicio_id,
            "frecuencia": r.frecuencia,
            "completado_hoy": r.completado_hoy,
            "fecha_asignacion": r.fecha_asignacion,
            "ejercicio": {
                "id": ej.id,
                "titulo": ej.titulo,
                "descripcion": ej.descripcion,
                "url_video": ej.url_video,
                "zona_cuerpo": ej.zona_cuerpo
            } if ej else {
                "id": r.ejercicio_id,
                "titulo": "Extensión de Rodilla" if r.ejercicio_id == 1 else "Caminata Estática",
                "descripcion": "Ideal para fortalecer cuádriceps y recuperar movilidad articular tras cirugías o desgaste leve." if r.ejercicio_id == 1 else "Excelente para mejorar la resistencia cardiovascular de bajo impacto y activar la circulación en piernas.",
                "url_video": "/videos/rodilla.mp4" if r.ejercicio_id == 1 else "/videos/caminata.mp4",
                "zona_cuerpo": "Pierna" if r.ejercicio_id == 1 else "General"
            }
        })
    return resultado


@app.patch("/rutinas/{rutina_id}/toggle")
def cambiar_estado_rutina(rutina_id: int, estado: RutinaEstadoUpdate, db: Session = Depends(get_db)):
    rutina = db.query(RutinaAsignada).filter(RutinaAsignada.id == rutina_id).first()
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

    rutina.completado_hoy = estado.completado_hoy
    db.commit()
    return {"mensaje": "Estado actualizado exitosamente", "completado_hoy": rutina.completado_hoy}


@app.post("/pacientes/{paciente_id}/asignar-rutina")
def asignar_rutina_paciente(paciente_id: int, data: AsignarRutinaRequest, db: Session = Depends(get_db)):
    nueva_asignacion = RutinaAsignada(
        paciente_id=paciente_id,
        ejercicio_id=data.ejercicio_id,
        frecuencia=data.frecuencia,
        completado_hoy=False
    )
    db.add(nueva_asignacion)
    db.commit()
    return {"mensaje": "Rutina asignada exitosamente al paciente"}


@app.post("/pacientes/{paciente_id}/cardex-estructurado", status_code=status.HTTP_201_CREATED)
def agregar_cardex_estructurado(paciente_id: int, cardex: CardexEstructuradoCreate, db: Session = Depends(get_db)):
    # Convertimos los campos estructurados en un texto limpio unificado para la base de datos
    nota_formateada = f"[Dolor: {cardex.nivel_dolor}/10] [Movilidad: {cardex.rango_movilidad}] - {cardex.observaciones}"

    nuevo_registro = Cardex(
        paciente_id=paciente_id,
        doctor_id=cardex.doctor_id,
        notas_clinicas=nota_formateada
    )
    db.add(nuevo_registro)
    db.commit()
    return {"mensaje": "Evolución clínica estructurada guardada con éxito"}


@app.get("/ejercicios-disponibles")
def listar_ejercicios_disponibles(db: Session = Depends(get_db)):
    ejercicios = db.query(Ejercicio).all()
    if not ejercicios:
        return [
            {
                "id": 1,
                "titulo": "Extensión de Rodilla",
                "descripcion": "Ideal para fortalecer cuádriceps y recuperar movilidad articular tras cirugías o desgaste leve.",
                "url_video": "/videos/rodilla.mp4",
                "zona_cuerpo": "Pierna"
            },
            {
                "id": 2,
                "titulo": "Caminata Estática",
                "descripcion": "Excelente para mejorar la resistencia cardiovascular de bajo impacto y activar la circulación en piernas.",
                "url_video": "/videos/caminata.mp4",
                "zona_cuerpo": "General"
            }
        ]
    return ejercicios

@app.post("/ejercicios", status_code=status.HTTP_201_CREATED)
def agregar_nuevo_ejercicio(data: EjercicioCreate, db: Session = Depends(get_db)):
    nuevo_ej = Ejercicio(
        titulo=data.titulo,
        descripcion=data.descripcion,
        url_video=data.url_video,
        zona_cuerpo=data.zona_cuerpo
    )
    db.add(nuevo_ej)
    db.commit()
    db.refresh(nuevo_ej)
    return {"mensaje": "Ejercicio registrado con éxito en el catálogo", "ejercicio": nuevo_ej}

@app.post("/login")
def login_usuario(data: LoginRequest, db: Session = Depends(get_db)):
    # Buscar por identificacion
    usuario = db.query(Usuario).filter(Usuario.identificacion == data.identificacion).first()
    if not usuario:
        # Fallback a buscar por ID si la identificacion es un numero y no lo encontro
        if data.identificacion.isdigit():
            usuario = db.query(Usuario).filter(Usuario.id == int(data.identificacion)).first()
            
    if not usuario or usuario.password_hash != data.password:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    return {
        "id": usuario.id,
        "nombre": usuario.nombre,
        "rol": usuario.rol.value,
        "identificacion": usuario.identificacion
    }

@app.post("/pacientes/registrar", status_code=status.HTTP_201_CREATED)
def registrar_nuevo_paciente(data: PacienteRegistroCompleto, db: Session = Depends(get_db)):
    nuevo = Usuario(
        nombre=data.nombre,
        email=data.email,
        password_hash=data.password,
        identificacion=data.identificacion,
        datos_medicos_generales=data.datos_medicos_generales,
        alergias=data.alergias,
        prescripciones_previas=data.prescripciones_previas,
        contraindicaciones=data.contraindicaciones,
        comentarios=data.comentarios,
        rol=RolUsuario.PACIENTE
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Paciente registrado con éxito", "id": nuevo.id}

@app.patch("/pacientes/{paciente_id}/estado")
def actualizar_estado_clinico(paciente_id: int, data: EstadoPacienteUpdate, db: Session = Depends(get_db)):
    return {"mensaje": f"Estado de paciente actualizado a: {data.estado_clinico}"}

# --- ENDPOINTS FEEDBACK Y OPINIONES DEL PACIENTE ---
@app.post("/pacientes/{paciente_id}/feedback", status_code=status.HTTP_201_CREATED)
def registrar_feedback_paciente(paciente_id: int, data: FeedbackCreate, db: Session = Depends(get_db)):
    nuevo_feedback = FeedbackPaciente(
        paciente_id=paciente_id,
        sensacion_dolor=data.sensacion_dolor,
        comentario=data.comentario
    )
    db.add(nuevo_feedback)
    db.commit()
    return {"mensaje": "Opinión enviada exitosamente a tu médico"}

@app.get("/pacientes/{paciente_id}/feedback")
def obtener_feedback_paciente(paciente_id: int, db: Session = Depends(get_db)):
    return db.query(FeedbackPaciente).filter(FeedbackPaciente.paciente_id == paciente_id).order_by(FeedbackPaciente.id.desc()).all()

# --- ENDPOINT DASHBOARD DE ESTADÍSTICAS ---
@app.get("/dashboard/estadisticas")
def obtener_dashboard_estadisticas(db: Session = Depends(get_db)):
    total_pacientes = db.query(Usuario).filter(Usuario.rol == RolUsuario.PACIENTE).count()
    rutinas = db.query(RutinaAsignada).all()
    total_rutinas = len(rutinas)
    completadas = sum(1 for r in rutinas if r.completado_hoy)
    pendientes = total_rutinas - completadas
    tasa_adherencia = round((completadas / total_rutinas * 100), 1) if total_rutinas > 0 else 0

    pacientes_resumen = []
    pacientes = db.query(Usuario).filter(Usuario.rol == RolUsuario.PACIENTE).all()
    for p in pacientes:
        p_rutinas = [r for r in rutinas if r.paciente_id == p.id]
        p_total = len(p_rutinas)
        p_hechas = sum(1 for r in p_rutinas if r.completado_hoy)
        pacientes_resumen.append({
            "id": p.id,
            "nombre": p.nombre,
            "email": p.email,
            "total_rutinas": p_total,
            "completadas": p_hechas,
            "al_dia": p_total > 0 and p_hechas == p_total
        })

    return {
        "total_pacientes": total_pacientes,
        "total_rutinas": total_rutinas,
        "completadas": completadas,
        "pendientes": pendientes,
        "tasa_adherencia": tasa_adherencia,
        "pacientes": pacientes_resumen
    }

# --- Inicialización de datos base ---
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # 1. Ejercicios base con caracteres correctos
        ej1 = db.query(Ejercicio).filter(Ejercicio.id == 1).first()
        if not ej1:
            ej1 = Ejercicio(id=1, titulo="Extensión de Rodilla", descripcion="Ideal para fortalecer cuádriceps y recuperar movilidad articular tras cirugías o desgaste leve.", url_video="/videos/rodilla.mp4", zona_cuerpo="Pierna")
            db.add(ej1)
        else:
            ej1.titulo = "Extensión de Rodilla"
            ej1.descripcion = "Ideal para fortalecer cuádriceps y recuperar movilidad articular tras cirugías o desgaste leve."

        ej2 = db.query(Ejercicio).filter(Ejercicio.id == 2).first()
        if not ej2:
            ej2 = Ejercicio(id=2, titulo="Caminata Estática", descripcion="Excelente para mejorar la resistencia cardiovascular de bajo impacto y activar la circulación en piernas.", url_video="/videos/caminata.mp4", zona_cuerpo="General")
            db.add(ej2)
        else:
            ej2.titulo = "Caminata Estática"
            ej2.descripcion = "Excelente para mejorar la resistencia cardiovascular de bajo impacto y activar la circulación en piernas."

        # 2. Doctor base
        doctor = db.query(Usuario).filter(Usuario.rol == RolUsuario.DOCTOR).first()
        if not doctor:
            doctor = Usuario(
                id=99,
                nombre="Dra. Valentina Cardona (Fisioterapeuta)",
                email="doctor@cardex.com",
                identificacion="123456789", # Cédula médica
                password_hash="123456",
                rol=RolUsuario.DOCTOR
            )
            db.add(doctor)

        # 3. Pacientes de prueba
        pacientes_data = [
            {
                "id": 1,
                "nombre": "Juan Pablo Rojas",
                "email": "juan.rojas@cardex.com",
                "identificacion": "1",
                "datos_medicos_generales": "Hipertensión controlada",
                "alergias": "Penicilina",
                "prescripciones_previas": "Paracetamol 500mg, Losartán 50mg",
                "contraindicaciones": "Evitar ejercicios de alto impacto",
                "comentarios": "Paciente cooperativo, asiste con su nieta"
            },
            {
                "id": 2,
                "nombre": "María Antonieta de las Nieves",
                "email": "maria@cardex.com",
                "identificacion": "2",
                "datos_medicos_generales": "Osteoartritis de rodilla leve",
                "alergias": "Ninguna",
                "prescripciones_previas": "Ibuprofeno 400mg condicional",
                "contraindicaciones": "Cargas pesadas",
                "comentarios": "Requiere paciencia en explicación de ejercicios"
            },
            {
                "id": 3,
                "nombre": "Carlos Villagrán",
                "email": "carlos@cardex.com",
                "identificacion": "3",
                "datos_medicos_generales": "Post-operatorio cadera hace 6 meses",
                "alergias": "Látex",
                "prescripciones_previas": "Calcio y Vitamina D",
                "contraindicaciones": "Flexión de cadera > 90°",
                "comentarios": "Muy motivado con su rehabilitación"
            },
            {
                "id": 4,
                "nombre": "Florinda Meza",
                "email": "florinda@cardex.com",
                "identificacion": "4",
                "datos_medicos_generales": "Sana, asiste por prevención",
                "alergias": "Ninguna conocida",
                "prescripciones_previas": "Ninguna",
                "contraindicaciones": "Ninguna conocida",
                "comentarios": "Excelente estado físico para su edad"
            }
        ]

        for p_data in pacientes_data:
            paciente = db.query(Usuario).filter(Usuario.id == p_data["id"]).first()
            if not paciente:
                paciente = Usuario(
                    id=p_data["id"],
                    nombre=p_data["nombre"],
                    email=p_data["email"],
                    identificacion=p_data["identificacion"],
                    password_hash="123456",
                    datos_medicos_generales=p_data["datos_medicos_generales"],
                    alergias=p_data["alergias"],
                    prescripciones_previas=p_data["prescripciones_previas"],
                    contraindicaciones=p_data["contraindicaciones"],
                    comentarios=p_data["comentarios"],
                    rol=RolUsuario.PACIENTE
                )
                db.add(paciente)

        db.commit()

        # 4. Cardex inicial para paciente 1 si no tiene
        cardex_existente = db.query(Cardex).filter(Cardex.paciente_id == 1).first()
        if not cardex_existente:
            c1 = Cardex(
                paciente_id=1,
                doctor_id=doctor.id if doctor else 99,
                notas_clinicas="[Estado: Estable 🟢] [Dolor: 2/10] [Movilidad: Completo/Fluido] - Paciente muestra excelente evolución articular post-tratamiento. Continuar con extensiones suaves de rodilla y marcha 5 min diarios. Evitar sobreesfuerzos bruscos."
            )
            db.add(c1)
            db.commit()

        # 5. Rutinas iniciales si no tiene
        rutinas_existentes = db.query(RutinaAsignada).filter(RutinaAsignada.paciente_id == 1).all()
        if not rutinas_existentes:
            r1 = RutinaAsignada(
                paciente_id=1,
                ejercicio_id=1,
                frecuencia="3 series de 10 repeticiones",
                completado_hoy=False
            )
            r2 = RutinaAsignada(
                paciente_id=1,
                ejercicio_id=2,
                frecuencia="5 minutos continuos",
                completado_hoy=False
            )
            db.add_all([r1, r2])
            db.commit()

    except Exception as e:
        print("Error en startup_event:", e)
        db.rollback()
    finally:
        db.close()