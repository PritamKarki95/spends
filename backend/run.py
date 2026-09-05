"""Start the API with `python backend/run.py` from the project root."""

import os
from pathlib import Path

import uvicorn


if __name__ == "__main__":
    os.chdir(Path(__file__).resolve().parent)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
