from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas

router = APIRouter(prefix="/donos", tags=["Donos"])

def get_db():
    """
    Função helper para obter sessão do banco de dados
    Garante que a sessão seja fechada após o uso
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CREATE - Criar novo dono
@router.post("/", response_model=schemas.Dono, status_code=status.HTTP_201_CREATED)
def criar_dono(dono: schemas.DonoCreate, db: Session = Depends(get_db)):
    """
    Cria um novo dono no sistema
    - Valida os dados recebidos através do schema
    - Retorna o dono criado com ID gerado
    """
    novo_dono = models.Dono(**dono.dict())
    db.add(novo_dono)
    db.commit()
    db.refresh(novo_dono)
    return novo_dono

# READ - Listar todos os donos (simples, sem relacionamentos para evitar erro)
@router.get("/")
def listar_donos(db: Session = Depends(get_db)):
    """
    Lista todos os donos cadastrados no sistema
    - Retorna lista simples sem relacionamentos para evitar erros de serialização
    """
    try:
        donos = db.query(models.Dono).all()
        return [{"id": dono.id, "nome": dono.nome, "telefone": dono.telefone} for dono in donos]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar donos: {str(e)}")

# READ - Obter dono por ID (simples)
@router.get("/{dono_id}")
def obter_dono(dono_id: int, db: Session = Depends(get_db)):
    """
    Obtém um dono específico pelo ID
    - Retorna 404 se o dono não for encontrado
    """
    dono = db.query(models.Dono).filter(models.Dono.id == dono_id).first()
    if not dono:
        raise HTTPException(status_code=404, detail="Dono não encontrado")
    
    return {"id": dono.id, "nome": dono.nome, "telefone": dono.telefone}

# UPDATE - Atualizar dono existente
@router.put("/{dono_id}")
def atualizar_dono(dono_id: int, dados: schemas.DonoCreate, db: Session = Depends(get_db)):
    """
    Atualiza os dados de um dono existente
    - Valida se o dono existe antes de atualizar
    - Atualiza apenas os campos fornecidos
    """
    dono = db.query(models.Dono).filter(models.Dono.id == dono_id).first()
    if not dono:
        raise HTTPException(status_code=404, detail="Dono não encontrado")

    # Atualiza os campos do dono com os novos dados
    for campo, valor in dados.dict().items():
        setattr(dono, campo, valor)
    
    db.commit()
    db.refresh(dono)
    return {"id": dono.id, "nome": dono.nome, "telefone": dono.telefone}

# DELETE - Remover dono
@router.delete("/{dono_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_dono(dono_id: int, db: Session = Depends(get_db)):
    """
    Remove um dono do sistema
    - Valida se o dono existe antes de deletar
    - Retorna 204 No Content em caso de sucesso
    """
    dono = db.query(models.Dono).filter(models.Dono.id == dono_id).first()
    if not dono:
        raise HTTPException(status_code=404, detail="Dono não encontrado")
    
    db.delete(dono)
    db.commit()
    return None