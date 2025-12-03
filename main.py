from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
from routers import (
    donos,
    animais,
    vacinas,
    auth,
    consultas,
    banho_tosa
)

# Criar tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Clínica Veterinária")

# CORS liberado
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers (API)
app.include_router(auth.router)        # /auth (API)
app.include_router(donos.router)       # /donos
app.include_router(animais.router)     # /animais
app.include_router(vacinas.router)     # /vacinas
app.include_router(consultas.router)   # /consultas
app.include_router(banho_tosa.router)  # /banho-tosa

# Frontend estático (servir páginas após incluir routers)
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")
app.mount("/auth", StaticFiles(directory="auth"), name="auth")

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "API Clínica Veterinária",
        "endpoints": [
            "/auth",
            "/donos",
            "/animais",
            "/vacinas",
            "/consultas",
            "/banho-tosa",
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
