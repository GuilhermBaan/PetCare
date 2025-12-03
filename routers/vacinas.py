from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas
from datetime import date

router = APIRouter(prefix="/vacinas", tags=["Vacinas"])

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

# CREATE - Criar nova vacina
@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_vacina(vacina: schemas.VacinaCreate, animal_id: int = Query(...), db: Session = Depends(get_db)):
    """
    Cria uma nova vacina no sistema
    - Valida se o animal existe antes de criar a vacina
    - Retorna a vacina criada com ID gerado
    """
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal não encontrado")
    
    nova_vacina = models.Vacina(**vacina.dict(), animal_id=animal_id)
    db.add(nova_vacina)
    db.commit()
    db.refresh(nova_vacina)
    return {
        "id": nova_vacina.id,
        "nome": nova_vacina.nome,
        "data_aplicacao": nova_vacina.data_aplicacao.isoformat() if nova_vacina.data_aplicacao else None,
        "animal_id": nova_vacina.animal_id
    }

# READ - Listar todas as vacinas
@router.get("/")
def listar_vacinas(db: Session = Depends(get_db)):
    """
    Lista todas as vacinas cadastradas no sistema
    - Retorna lista com dados básicos para evitar erros de serialização
    """
    try:
        vacinas = db.query(models.Vacina).all()
        return [
            {
                "id": vacina.id,
                "nome": vacina.nome,
                "data_aplicacao": vacina.data_aplicacao.isoformat() if vacina.data_aplicacao else None,
                "animal_id": vacina.animal_id
            }
            for vacina in vacinas
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar vacinas: {str(e)}")

# READ - Obter vacina por ID
@router.get("/{vacina_id}")
def obter_vacina(vacina_id: int, db: Session = Depends(get_db)):
    """
    Obtém uma vacina específica pelo ID
    - Retorna 404 se a vacina não for encontrada
    """
    vacina = db.query(models.Vacina).filter(models.Vacina.id == vacina_id).first()
    if not vacina:
        raise HTTPException(status_code=404, detail="Vacina não encontrada")
    
    return {
        "id": vacina.id,
        "nome": vacina.nome,
        "data_aplicacao": vacina.data_aplicacao.isoformat() if vacina.data_aplicacao else None,
        "animal_id": vacina.animal_id
    }

# UPDATE - Atualizar vacina existente
@router.put("/{vacina_id}")
def atualizar_vacina(vacina_id: int, dados: schemas.VacinaCreate, db: Session = Depends(get_db)):
    """
    Atualiza os dados de uma vacina existente
    - Valida se a vacina existe antes de atualizar
    """
    vacina = db.query(models.Vacina).filter(models.Vacina.id == vacina_id).first()
    if not vacina:
        raise HTTPException(status_code=404, detail="Vacina não encontrada")

    # Atualiza os campos da vacina com os novos dados
    for campo, valor in dados.dict().items():
        setattr(vacina, campo, valor)
    
    db.commit()
    db.refresh(vacina)
    return {
        "id": vacina.id,
        "nome": vacina.nome,
        "data_aplicacao": vacina.data_aplicacao.isoformat() if vacina.data_aplicacao else None,
        "animal_id": vacina.animal_id
    }

# DELETE - Remover vacina
@router.delete("/{vacina_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_vacina(vacina_id: int, db: Session = Depends(get_db)):
    """
    Remove uma vacina do sistema
    - Valida se a vacina existe antes de deletar
    - Retorna 204 No Content em caso de sucesso
    """
    vacina = db.query(models.Vacina).filter(models.Vacina.id == vacina_id).first()
    if not vacina:
        raise HTTPException(status_code=404, detail="Vacina não encontrada")
    
    db.delete(vacina)
    db.commit()
    return None

# GET - Listar vacinas por animal
@router.get("/animal/{animal_id}")
def listar_vacinas_por_animal(animal_id: int, db: Session = Depends(get_db)):
    """
    Lista todas as vacinas de um animal específico
    - Valida se o animal existe
    - Retorna lista de vacinas do animal
    """
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal não encontrado")
    
    vacinas = db.query(models.Vacina).filter(models.Vacina.animal_id == animal_id).all()
    return [
        {
            "id": vacina.id,
            "nome": vacina.nome,
            "data_aplicacao": vacina.data_aplicacao.isoformat() if vacina.data_aplicacao else None,
            "animal_id": vacina.animal_id
        }
        for vacina in vacinas
    ]