PetCare – Sistema de Gestão Veterinária

O PetCare é um sistema completo de gerenciamento para clínicas veterinárias, desenvolvido com FastAPI no backend e HTML/CSS/JS no frontend.
Permite administrar donos, animais, consultas, vacinas e serviços de banho e tosa de forma simples e eficiente.

📂 Estrutura do Projeto
Trabalho/
├── auth/
│   ├── auth.css
│   ├── auth.js
│   ├── cadastro.html
│   └── login.html
├── frontend/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── routers/
│   ├── animais.py
│   ├── auth.py
│   ├── banho_tosa.py
│   ├── consultas.py
│   ├── donos.py
│   └── vacinas.py
├── database.py
├── main.py
├── models.py
├── schemas.py
├── security.py
└── clinica_vet.db

⚙️ Ambiente Virtual (venv)

Antes de instalar as dependências, é recomendado criar um ambiente virtual para isolar os pacotes do projeto.

📦 Como criar e ativar o venv
Etapa	Windows	Linux / MacOS
Criar venv	python -m venv venv	python3 -m venv venv
Ativar venv	venv\Scripts\activate	source venv/bin/activate
Desativar	deactivate	deactivate
Instalar libs	pip install -r requirements.txt	pip install -r requirements.txt

Quando ativado, o terminal fica assim:

(venv) C:\seuprojeto>

🚀 Como Executar o Sistema
1. Acesse o diretório do projeto
cd projeto_petshop/Trabalho

2. Crie e ative o venv
python -m venv venv
venv\Scripts\activate

3. Instale as dependências
pip install -r requirements.txt

4. Inicie o servidor FastAPI
python main.py



Acessos Principais

Recurso	URL
Sistema Principal	http://localhost:8000

Login	http://localhost:8000/auth/login.html

Cadastro	http://localhost:8000/auth/cadastro.html

Documentação Swagger	http://localhost:8000/docs
👤 Criar o Primeiro Usuário

Acesse:

http://localhost:8000/auth/cadastro.html


Cadastre email e senha → depois faça login.

🧪 Teste Rápido
curl http://localhost:8000/


Resposta esperada:

{
  "mensagem": "API Clínica Veterinária rodando com SQLite 🐾",
  "status": "online",
  "versao": "1.0.0"
}

💾 Banco de Dados

O sistema já possui o arquivo SQLite (clinica_vet.db).
Para recriar:

rm clinica_vet.db
python update_database.py


Link Video=https://youtu.be/Vz-q51-K63A

