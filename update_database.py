"""
Script para atualizar o banco de dados com a nova tabela de banho e tosa
"""

import sqlite3
from database import SessionLocal, engine, Base
from models import BanhoTosa
import models

def update_database():
    """Atualiza o banco de dados com as novas tabelas"""
    try:
        print("🔧 Atualizando banco de dados...")
        
        # Cria todas as tabelas definidas nos modelos
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas criadas/atualizadas com sucesso!")
        
        # Verifica se a tabela banho_tosa existe
        db = SessionLocal()
        try:
            # Tenta fazer uma consulta à tabela para verificar se existe
            db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='banho_tosa'")
            result = db.fetchone()
            
            if result:
                print("✅ Tabela 'banho_tosa' encontrada e pronta para uso!")
            else:
                print("❌ Tabela 'banho_tosa' não encontrada")
                
        except Exception as e:
            print(f"❌ Erro ao verificar tabela: {e}")
        finally:
            db.close()
            
        # Verifica estrutura atual do banco
        print("\n📋 Estrutura atual das tabelas:")
        conn = sqlite3.connect('clinica_vet.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        for table in tables:
            print(f"  📁 {table[0]}")
            
        conn.close()
        
        print("\n🎉 Banco de dados atualizado com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao atualizar banco de dados: {e}")
        raise

if __name__ == "__main__":
    update_database()