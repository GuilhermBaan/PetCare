from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
import enum

class Dono(Base):
    __tablename__ = "donos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    telefone = Column(String)
    animais = relationship("Animal", back_populates="dono")
    consultas = relationship("Consulta", back_populates="dono")
    servicos_banho_tosa = relationship("BanhoTosa", back_populates="dono")

class Animal(Base):
    __tablename__ = "animais"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    especie = Column(String)
    idade = Column(Integer)
    dono_id = Column(Integer, ForeignKey("donos.id"))
    dono = relationship("Dono", back_populates="animais")
    vacinas = relationship("Vacina", back_populates="animal")
    consultas = relationship("Consulta", back_populates="animal")
    servicos_banho_tosa = relationship("BanhoTosa", back_populates="animal")

class Vacina(Base):
    __tablename__ = "vacinas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    data_aplicacao = Column(Date)
    animal_id = Column(Integer, ForeignKey("animais.id"))
    animal = relationship("Animal", back_populates="vacinas")

# ===== ENUMS PARA CONSULTAS =====
class StatusConsulta(str, enum.Enum):
    AGENDADA = "agendada"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"
    EM_ANDAMENTO = "em_andamento"

class Consulta(Base):
    __tablename__ = "consultas"
    id = Column(Integer, primary_key=True, index=True)
    data_hora = Column(DateTime, nullable=False)
    motivo = Column(String, nullable=False)
    observacoes = Column(Text)
    status = Column(String, default="agendada")  # Mudado para String simples
    valor = Column(Integer)  # Valor em centavos
    dono_id = Column(Integer, ForeignKey("donos.id"))
    animal_id = Column(Integer, ForeignKey("animais.id"))
    
    # Relacionamentos
    dono = relationship("Dono", back_populates="consultas")
    animal = relationship("Animal", back_populates="consultas")

# ===== ENUMS PARA BANHO E TOSA =====
class StatusServico(str, enum.Enum):
    AGENDADO = "agendado"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDO = "concluido"
    CANCELADO = "cancelado"

class TipoServico(str, enum.Enum):
    BANHO = "banho"
    TOSA = "tosa"
    BANHO_E_TOSA = "banho_e_tosa"

class BanhoTosa(Base):
    __tablename__ = "banho_tosa"
    
    id = Column(Integer, primary_key=True, index=True)
    data_hora = Column(DateTime, nullable=False)
    tipo_servico = Column(String, nullable=False)  # Mudado para String simples
    status = Column(String, default="agendado")  # Mudado para String simples
    valor = Column(Integer)  # Valor em centavos
    observacoes = Column(Text)
    duracao_estimada = Column(Integer)  # Duração em minutos
    
    # Relacionamentos
    dono_id = Column(Integer, ForeignKey("donos.id"))
    animal_id = Column(Integer, ForeignKey("animais.id"))
    
    dono = relationship("Dono", back_populates="servicos_banho_tosa")
    animal = relationship("Animal", back_populates="servicos_banho_tosa")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    hashed_password = Column(String, nullable=False)