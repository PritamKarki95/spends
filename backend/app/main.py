if __name__ == "__main__" and not __package__:
    import runpy
    import sys
    from pathlib import Path

    backend_dir = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(backend_dir))
    runpy.run_path(str(backend_dir / "run.py"), run_name="__main__")
    raise SystemExit

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

from app import models
from app.routers import auth as auth_router

from app.routers import statements as statements_router
from app.routers import transactions as transactions_router
from app.routers import comparisons as comparisons_router
from app.routers import subscriptions as subscriptions_router


app = FastAPI(title=settings.app_name)

app.include_router(auth_router.router)

app.include_router(statements_router.router)
app.include_router(transactions_router.router)
app.include_router(comparisons_router.router)
app.include_router(subscriptions_router.router)
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
