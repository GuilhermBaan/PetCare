from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import schemas
from typing import List, Any, Dict

router = APIRouter(prefix="/consultas", tags=["Consultas"])


# --------------------------
# DB Session
# --------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------
# Normalização de ENUM (aceita maiúscula/minúscula)
# --------------------------
def normalizar_status_consulta(value: str) -> str:
    """Normaliza status para minúscula"""
    if not value:
        return "agendada"
    
    v = str(value).strip().lower()
    
    # Mapeamento de variações aceitas
    mapa = {
        "agendada": "agendada",
        "AGENDADA": "agendada",
        "em_andamento": "em_andamento",
        "EM_ANDAMENTO": "em_andamento",
        "em andamento": "em_andamento",
        "Em_Andamento": "em_andamento",
        "concluida": "concluida",
        "CONCLUIDA": "concluida",
        "concluída": "concluida",
        "cancelada": "cancelada",
        "CANCELADA": "cancelada"
    }
    
    if value in mapa:
        return mapa[value]
    
    if v in mapa:
        return mapa[v]
    
    # Se não encontrar, retorna o valor original normalizado
    return v if v in ["agendada", "em_andamento", "concluida", "cancelada"] else "agendada"


# --------------------------
# Serializar consulta (evita erros de relacionamento)
# --------------------------
def serializar_consulta(consulta):
    """Serializa consulta com segurança"""
    return {
        "id": consulta.id,
        "data_hora": consulta.data_hora.isoformat() if consulta.data_hora else None,
        "motivo": consulta.motivo,
        "observacoes": consulta.observacoes,
        "status": consulta.status,
        "valor": consulta.valor,
        "dono_id": consulta.dono_id,
        "animal_id": consulta.animal_id,
        "dono_nome": consulta.dono.nome if consulta.dono else None,
        "animal_nome": consulta.animal.nome if consulta.animal else None
    }


# --------------------------
# Criar consulta
# --------------------------
@router.post("/", status_code=201)
def criar_consulta(data: schemas.ConsultaCreate, db: Session = Depends(get_db)):
    """Cria nova consulta"""
    
    # Validar dono
    dono = db.query(models.Dono).filter(models.Dono.id == data.dono_id).first()
    if not dono:
        raise HTTPException(404, "Dono não encontrado")

    # Validar animal
    animal = db.query(models.Animal).filter(models.Animal.id == data.animal_id).first()
    if not animal:
        raise HTTPException(404, "Animal não encontrado")

    # Normalizar status
    status_normalizado = normalizar_status_consulta(data.status)

    # Criar consulta
    consulta = models.Consulta(
        data_hora=data.data_hora,
        motivo=data.motivo,
        observacoes=data.observacoes,
        status=status_normalizado,
        valor=data.valor,
        dono_id=data.dono_id,
        animal_id=data.animal_id
    )
    
    db.add(consulta)
    db.commit()
    db.refresh(consulta)
    
    return serializar_consulta(consulta)


# --------------------------
# Listar todas
# --------------------------
@router.get("/")
def listar_consultas(db: Session = Depends(get_db)):
    """Lista todas as consultas"""
    consultas = db.query(models.Consulta).all()
    return [serializar_consulta(c) for c in consultas]


# --------------------------
# Buscar por ID
# --------------------------
@router.get("/{consulta_id}")
def obter_consulta(consulta_id: int, db: Session = Depends(get_db)):
    """Obtém consulta por ID"""
    consulta = db.query(models.Consulta).filter(models.Consulta.id == consulta_id).first()
    if not consulta:
        raise HTTPException(404, "Consulta não encontrada")
    return serializar_consulta(consulta)


# --------------------------
# Atualizar
# --------------------------
@router.put("/{consulta_id}")
def atualizar_consulta(consulta_id: int, dados: schemas.ConsultaUpdate, db: Session = Depends(get_db)):
    """Atualiza consulta existente"""
    
    consulta = db.query(models.Consulta).filter(models.Consulta.id == consulta_id).first()
    if not consulta:
        raise HTTPException(404, "Consulta não encontrada")

    update_data = dados.dict(exclude_unset=True)

    # Normalizar status se fornecido
    if "status" in update_data:
        update_data["status"] = normalizar_status_consulta(update_data["status"])

    # Atualizar campos
    for campo, valor in update_data.items():
        setattr(consulta, campo, valor)

    db.commit()
    db.refresh(consulta)
    
    return serializar_consulta(consulta)


# --------------------------
# Excluir
# --------------------------
@router.delete("/{consulta_id}", status_code=204)
def deletar_consulta(consulta_id: int, db: Session = Depends(get_db)):
    """Remove consulta"""
    
    consulta = db.query(models.Consulta).filter(models.Consulta.id == consulta_id).first()
    if not consulta:
        raise HTTPException(404, "Consulta não encontrada")

    db.delete(consulta)
    db.commit()
    return None


# --------------------------
# Dashboard (estatísticas)
# --------------------------
@router.get("/stats/dashboard")
def stats_dashboard(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retorna estatísticas do dashboard"""
    
    consultas = db.query(models.Consulta).all()
    
    total = len(consultas)
    agendadas = sum(1 for c in consultas if c.status == "agendada")
    concluidas = sum(1 for c in consultas if c.status == "concluida")
    canceladas = sum(1 for c in consultas if c.status == "cancelada")
    em_andamento = sum(1 for c in consultas if c.status == "em_andamento")
    
    return {
        "total_consultas": total,
        "agendadas": agendadas,
        "concluidas": concluidas,
        "canceladas": canceladas,
        "em_andamento": em_andamento
    }