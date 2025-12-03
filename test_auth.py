"""
Script de teste para o sistema de autenticação
"""

import requests
import json

# URL base da API
BASE_URL = "http://127.0.0.1:8000"

def test_register():
    """Teste de cadastro de usuário"""
    print("🔍 Testando cadastro de usuário...")
    
    user_data = {
        "nome": "Test User",
        "email": "test@example.com",
        "password": "test123456"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        
        if response.status_code == 200:
            print("✅ Usuário criado com sucesso!")
            print(f"   ID: {response.json()['id']}")
            print(f"   Nome: {response.json()['nome']}")
            print(f"   Email: {response.json()['email']}")
            return True
        else:
            print(f"❌ Erro ao criar usuário: {response.status_code}")
            print(f"   Detalhes: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def test_login():
    """Teste de login"""
    print("\n🔍 Testando login...")
    
    login_data = {
        "email": "test@example.com",
        "password": "test123456"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login realizado com sucesso!")
            print(f"   Token: {token_data['access_token'][:50]}...")
            return token_data['access_token']
        else:
            print(f"❌ Erro ao fazer login: {response.status_code}")
            print(f"   Detalhes: {response.json()}")
            return None
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return None

def test_protected_route(token):
    """Teste de rota protegida"""
    print("\n🔍 Testando rota protegida...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if response.status_code == 200:
            user_data = response.json()
            print("✅ Acesso à rota protegida concedido!")
            print(f"   Usuário: {user_data['nome']}")
            print(f"   Email: {user_data['email']}")
            return True
        else:
            print(f"❌ Erro ao acessar rota protegida: {response.status_code}")
            print(f"   Detalhes: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def main():
    """Função principal de teste"""
    print("🚀 Iniciando testes do sistema de autenticação")
    print("=" * 50)
    
    # Testar cadastro
    if test_register():
        # Testar login
        token = test_login()
        if token:
            # Testar rota protegida
            test_protected_route(token)
    
    print("\n" + "=" * 50)
    print("🏁 Testes concluídos!")

if __name__ == "__main__":
    main()