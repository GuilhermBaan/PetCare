from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import schemas
from typing import List, Dict, Any

router = APIRouter(prefix="/banho-tosa", tags=["Banho e Tosa"])


# ----------------------------
# DB session
# ----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ----------------------------
# Normalização de Status (aceita maiúscula/minúscula)
# ----------------------------
def normalizar_status(value: str) -> str:
    """Normaliza status para minúscula"""
    if not value:
        return "agendado"
    
    v = str(value).strip().lower()
    
    mapa = {
        "agendado": "agendado",
        "AGENDADO": "agendado",
        "em_andamento": "em_andamento",
        "EM_ANDAMENTO": "em_andamento",
        "em andamento": "em_andamento",
        "Em_Andamento": "em_andamento",
        "concluido": "concluido",
        "CONCLUIDO": "concluido",
        "concluído": "concluido",
        "cancelado": "cancelado",
        "CANCELADO": "cancelado"
    }
    
    if value in mapa:
        return mapa[value]
    
    if v in mapa:
        return mapa[v]
    
    return v if v in ["agendado", "em_andamento", "concluido", "cancelado"] else "agendado"


# ----------------------------
# Normalização de Tipo de Serviço
# ----------------------------
def normalizar_tipo_servico(value: str) -> str:
    """Normaliza tipo de serviço para minúscula"""
    if not value:
        return "banho"
    
    v = str(value).strip().lower()
    
    mapa = {
        "banho": "banho",
        "BANHO": "banho",
        "tosa": "tosa",
        "TOSA": "tosa",
        "banho_e_tosa": "banho_e_tosa",
        "BANHO_E_TOSA": "banho_e_tosa",
        "banho e tosa": "banho_e_tosa",
        "Banho_e_Tosa": "banho_e_tosa",
        "Banho e Tosa": "banho_e_tosa"
    }
    
    if value in mapa:
        return mapa[value]
    
    if v in mapa:
        return mapa[v]
    
    return v if v in ["banho", "tosa", "banho_e_tosa"] else "banho"


# ----------------------------
# Serializar serviço (evita erros de relacionamento)
# ----------------------------
def serializar_servico(servico):
    """Serializa serviço com segurança"""
    return {
        "id": servico.id,
        "data_hora": servico.data_hora.isoformat() if servico.data_hora else None,
        "tipo_servico": servico.tipo_servico,
        "status": servico.status,
        "valor": servico.valor,
        "observacoes": servico.observacoes,
        "duracao_estimada": servico.duracao_estimada,
        "dono_id": servico.dono_id,
        "animal_id": servico.animal_id,
        "dono_nome": servico.dono.nome if servico.dono else None,
        "animal_nome": servico.animal.nome if servico.animal else None
    }


# ----------------------------
# Criar serviço
# ----------------------------
@router.post("/", status_code=201)
def criar_servico(data: schemas.BanhoTosaCreate, db: Session = Depends(get_db)):
    """Cria novo serviço de banho/tosa"""
    
    # Validar dono
    dono = db.query(models.Dono).filter(models.Dono.id == data.dono_id).first()
    if not dono:
        raise HTTPException(404, "Dono não encontrado")

    # Validar animal
    animal = db.query(models.Animal).filter(models.Animal.id == data.animal_id).first()
    if not animal:
        raise HTTPException(404, "Animal não encontrado")

    # Normalizar valores
    status_normalizado = normalizar_status(data.status)
    tipo_normalizado = normalizar_tipo_servico(data.tipo_servico)

    # Criar serviço
    servico = models.BanhoTosa(
        data_hora=data.data_hora,
        tipo_servico=tipo_normalizado,
        status=status_normalizado,
        valor=data.valor,
        observacoes=data.observacoes,
        duracao_estimada=data.duracao_estimada,
        dono_id=data.dono_id,
        animal_id=data.animal_id
    )
    
    db.add(servico)
    db.commit()
    db.refresh(servico)
    
    return serializar_servico(servico)


# ----------------------------
# Listar todos
# ----------------------------
@router.get("/")
def listar_servicos(db: Session = Depends(get_db)):
    """Lista todos os serviços"""
    servicos = db.query(models.BanhoTosa).all()
    return [serializar_servico(s) for s in servicos]


# ----------------------------
# Buscar por ID
# ----------------------------
@router.get("/{servico_id}")
def obter_servico(servico_id: int, db: Session = Depends(get_db)):
    """Obtém serviço por ID"""
    servico = db.query(models.BanhoTosa).filter(models.BanhoTosa.id == servico_id).first()
    if not servico:
        raise HTTPException(404, "Serviço não encontrado")
    return serializar_servico(servico)


# ----------------------------
# Atualizar
# ----------------------------
@router.put("/{servico_id}")
def atualizar_servico(servico_id: int, dados: schemas.BanhoTosaUpdate, db: Session = Depends(get_db)):
    """Atualiza serviço existente"""
    
    servico = db.query(models.BanhoTosa).filter(models.BanhoTosa.id == servico_id).first()
    if not servico:
        raise HTTPException(404, "Serviço não encontrado")

    update_data = dados.dict(exclude_unset=True)

    # Normalizar se fornecidos
    if "status" in update_data:
        update_data["status"] = normalizar_status(update_data["status"])

    if "tipo_servico" in update_data:
        update_data["tipo_servico"] = normalizar_tipo_servico(update_data["tipo_servico"])

    # Atualizar campos
    for campo, valor in update_data.items():
        setattr(servico, campo, valor)

    db.commit()
    db.refresh(servico)
    
    return serializar_servico(servico)


# ----------------------------
# Remover
# ----------------------------
@router.delete("/{servico_id}", status_code=204)
def remover_servico(servico_id: int, db: Session = Depends(get_db)):
    """Remove serviço"""
    
    servico = db.query(models.BanhoTosa).filter(models.BanhoTosa.id == servico_id).first()
    if not servico:
        raise HTTPException(404, "Serviço não encontrado")

    db.delete(servico)
    db.commit()
    return None


# ----------------------------
# Dashboard (estatísticas)
# ----------------------------
@router.get("/stats/dashboard")
def stats_dashboard(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retorna estatísticas do dashboard"""
    
    servicos = db.query(models.BanhoTosa).all()
    
    total = len(servicos)
    agendados = sum(1 for s in servicos if s.status == "agendado")
    concluidos = sum(1 for s in servicos if s.status == "concluido")
    cancelados = sum(1 for s in servicos if s.status == "cancelado")
    em_andamento = sum(1 for s in servicos if s.status == "em_andamento")
    
    return {
        "total_servicos": total,
        "agendados": agendados,
        "concluidos": concluidos,
        "cancelados": cancelados,
        "em_andamento": em_andamento
    }