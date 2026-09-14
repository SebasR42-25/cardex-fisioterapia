import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import declarative_base, relationship

# Base para crear los modelos
Base = declarative_base()

# 1. Definimos los Roles posibles en el sistema
class RolUsuario(enum.Enum):
    DOCTOR = "doctor"
    PACIENTE = "paciente"

# 2. Modelo Principal de Usuario (Sirve para Doctores y Pacientes)
class Usuario(Base):
    __tablename__ = 'usuarios'

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(Enum(RolUsuario), nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    cardex_como_paciente = relationship("Cardex", foreign_keys='Cardex.paciente_id', back_populates="paciente")
    cardex_como_doctor = relationship("Cardex", foreign_keys='Cardex.doctor_id', back_populates="doctor")
    rutinas = relationship("RutinaAsignada", back_populates="paciente")
    feedback = relationship("FeedbackPaciente", back_populates="paciente")

# 3. Modelo del Cardex (Historial Clínico)
class Cardex(Base):
    __tablename__ = 'cardex'

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    doctor_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)
    notas_clinicas = Column(Text, nullable=False)

    paciente = relationship("Usuario", foreign_keys=[paciente_id], back_populates="cardex_como_paciente")
    doctor = relationship("Usuario", foreign_keys=[doctor_id], back_populates="cardex_como_doctor")

# 4. Catálogo de Ejercicios
class Ejercicio(Base):
    __tablename__ = 'ejercicios'

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(150), nullable=False)
    descripcion = Column(Text)
    url_video = Column(String(255), nullable=False)
    zona_cuerpo = Column(String(50))

    rutinas_asignadas = relationship("RutinaAsignada", back_populates="ejercicio")

# 5. Rutinas Asignadas
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

# 6. Feedback y Opiniones del Paciente
class FeedbackPaciente(Base):
    __tablename__ = 'feedback_pacientes'

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    sensacion_dolor = Column(String(50), nullable=True)
    comentario = Column(Text, nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)

    paciente = relationship("Usuario", back_populates="feedback")