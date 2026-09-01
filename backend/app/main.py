from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

from app import models
from app.routers import auth as auth_router

from app.routers import statements as statements_router


app = FastAPI(title=settings.app_name)

app.include_router(auth_router.router)

app.include_router(statements_router.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": f"{settings.app_name} is running", "environment": settings.environment}
