from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas

router = APIRouter(prefix="/animais", tags=["Animais"])

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

# CREATE - Criar novo animal
@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_animal(animal: schemas.AnimalCreate, db: Session = Depends(get_db)):
    """
    Cria um novo animal no sistema
    - Valida se o dono existe antes de criar o animal
    - Retorna o animal criado com ID gerado
    """
    dono = db.query(models.Dono).filter(models.Dono.id == animal.dono_id).first()
    if not dono:
        raise HTTPException(status_code=404, detail="Dono não encontrado")
    
    novo_animal = models.Animal(**animal.dict())
    db.add(novo_animal)
    db.commit()
    db.refresh(novo_animal)
    return {
        "id": novo_animal.id, 
        "nome": novo_animal.nome, 
        "especie": novo_animal.especie, 
        "idade": novo_animal.idade,
        "dono_id": novo_animal.dono_id
    }

# READ - Listar todos os animais
@router.get("/")
def listar_animais(db: Session = Depends(get_db)):
    """
    Lista todos os animais cadastrados no sistema
    - Retorna lista com dados básicos para evitar erros de serialização
    """
    try:
        animais = db.query(models.Animal).all()
        return [
            {
                "id": animal.id, 
                "nome": animal.nome, 
                "especie": animal.especie, 
                "idade": animal.idade,
                "dono_id": animal.dono_id
            } 
            for animal in animais
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar animais: {str(e)}")

# READ - Obter animal por ID
@router.get("/{animal_id}")
def obter_animal(animal_id: int, db: Session = Depends(get_db)):
    """
    Obtém um animal específico pelo ID
    - Retorna 404 se o animal não for encontrado
    """
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal não encontrado")
    
    return {
        "id": animal.id, 
        "nome": animal.nome, 
        "especie": animal.especie, 
        "idade": animal.idade,
        "dono_id": animal.dono_id
    }

# UPDATE - Atualizar animal existente
@router.put("/{animal_id}")
def atualizar_animal(animal_id: int, dados: schemas.AnimalCreate, db: Session = Depends(get_db)):
    """
    Atualiza os dados de um animal existente
    - Valida se o animal existe antes de atualizar
    - Valida se o dono informado existe
    """
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal não encontrado")
    
    # Valida se o dono informado existe
    dono = db.query(models.Dono).filter(models.Dono.id == dados.dono_id).first()
    if not dono:
        raise HTTPException(status_code=404, detail="Dono não encontrado")

    # Atualiza os campos do animal com os novos dados
    for campo, valor in dados.dict().items():
        setattr(animal, campo, valor)
    
    db.commit()
    db.refresh(animal)
    return {
        "id": animal.id, 
        "nome": animal.nome, 
        "especie": animal.especie, 
        "idade": animal.idade,
        "dono_id": animal.dono_id
    }

# DELETE - Remover animal
@router.delete("/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_animal(animal_id: int, db: Session = Depends(get_db)):
    """
    Remove um animal do sistema
    - Valida se o animal existe antes de deletar
    - Retorna 204 No Content em caso de sucesso
    """
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal não encontrado")
    
    db.delete(animal)
    db.commit()
    return None