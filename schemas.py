from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from enum import Enum

class VacinaBase(BaseModel):
    """
    Schema base para vacina com campos essenciais
    """
    nome: str
    data_aplicacao: date

class VacinaCreate(VacinaBase):
    """
    Schema para criação de nova vacina
    Herda campos do base e não inclui ID (gerado automaticamente)
    """
    pass

class Vacina(VacinaBase):
    """
    Schema completo para vacina usado em respostas
    Inclui ID e relacionamento com o animal
    """
    id: int
    animal_id: int
    animal: Optional['Animal'] = None
    
    class Config:
        from_attributes = True

class AnimalBase(BaseModel):
    """
    Schema base para animal com campos essenciais
    """
    nome: str
    especie: str
    idade: int

class AnimalCreate(AnimalBase):
    """
    Schema para criação de novo animal
    Inclui dono_id para estabelecer relacionamento
    """
    dono_id: int

class Animal(AnimalBase):
    """
    Schema completo para animal usado em respostas
    Inclui ID, dono relacionado e lista de vacinas
    """
    id: int
    dono_id: int
    dono: Optional['Dono'] = None
    vacinas: List[Vacina] = []
    
    class Config:
        from_attributes = True

class DonoBase(BaseModel):
    """
    Schema base para dono com campos essenciais
    """
    nome: str
    telefone: str

class DonoCreate(DonoBase):
    """
    Schema para criação de novo dono
    """
    pass

class Dono(DonoBase):
    """
    Schema completo para dono usado em respostas
    Inclui ID e lista de animais relacionados
    """
    id: int
    animais: List[Animal] = []
    
    class Config:
        from_attributes = True
        

class UserBase(BaseModel):
    nome: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

# Login
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# JWT
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int | None = None
        
        
class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    nome: str
    email: EmailStr
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    

# ===== SCHEMAS DE CONSULTAS (CORRIGIDO) =====
class StatusConsulta(str, Enum):
    AGENDADA = "agendada"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"
    EM_ANDAMENTO = "em_andamento"

class ConsultaBase(BaseModel):
    """Schema base para consulta"""
    data_hora: datetime
    motivo: str
    observacoes: Optional[str] = None
    status: str = "agendada"  # MUDADO PARA STRING SIMPLES
    valor: Optional[int] = None

class ConsultaCreate(ConsultaBase):
    """Schema para criação de nova consulta"""
    dono_id: int
    animal_id: int

class ConsultaUpdate(BaseModel):
    """Schema para atualização de consulta"""
    data_hora: Optional[datetime] = None
    motivo: Optional[str] = None
    observacoes: Optional[str] = None
    status: Optional[str] = None  # MUDADO PARA STRING SIMPLES
    valor: Optional[int] = None

class Consulta(ConsultaBase):
    """Schema completo para consulta"""
    id: int
    dono_id: int
    animal_id: int
    dono: Optional['Dono'] = None
    animal: Optional['Animal'] = None
    
    class Config:
        from_attributes = True


# ===== SCHEMAS DE BANHO E TOSA (CORRIGIDO) =====
class StatusServico(str, Enum):
    AGENDADO = "agendado"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDO = "concluido"
    CANCELADO = "cancelado"

class TipoServico(str, Enum):
    BANHO = "banho"
    TOSA = "tosa"
    BANHO_E_TOSA = "banho_e_tosa"

class BanhoTosaBase(BaseModel):
    """Schema base para serviço de banho e tosa"""
    data_hora: datetime
    tipo_servico: str  # MUDADO PARA STRING SIMPLES
    status: str = "agendado"  # MUDADO PARA STRING SIMPLES
    valor: Optional[int] = None
    observacoes: Optional[str] = None
    duracao_estimada: Optional[int] = None

class BanhoTosaCreate(BanhoTosaBase):
    """Schema para criação de novo serviço"""
    dono_id: int
    animal_id: int

class BanhoTosaUpdate(BaseModel):
    """Schema para atualização de serviço"""
    data_hora: Optional[datetime] = None
    tipo_servico: Optional[str] = None  # MUDADO PARA STRING SIMPLES
    status: Optional[str] = None  # MUDADO PARA STRING SIMPLES
    valor: Optional[int] = None
    observacoes: Optional[str] = None
    duracao_estimada: Optional[int] = None

class BanhoTosa(BanhoTosaBase):
    """Schema completo para serviço de banho e tosa"""
    id: int
    dono_id: int
    animal_id: int
    dono: Optional['Dono'] = None
    animal: Optional['Animal'] = None
    
    class Config:
        from_attributes = True

class StatusServicoUpdate(BaseModel):
    """Schema para atualização apenas do status do serviço"""
    status: str  # MUDADO PARA STRING SIMPLES