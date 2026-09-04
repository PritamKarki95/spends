import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import pdfplumber
from app.database import get_db
from app.auth import get_current_user
from app import models, schemas
from app.services.pdf_parser import parse_statement_text
from datetime import datetime
from app.services.categorizer import categorize_transaction

router = APIRouter(prefix="/statements", tags=["statements"])

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
os.makedirs(UPLOAD_DIR, exist_ok=True)



@router.post("/upload", response_model=schemas.StatementUploadResponse)
async def upload_statement(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # --- Validation ---
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit.")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # --- Save file with a unique name (never trust the original filename alone) ---
    safe_filename = f"{uuid.uuid4()}.pdf"
    filepath = os.path.join(UPLOAD_DIR, safe_filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    # --- Create Statement record ---
    statement = models.Statement(
        user_id=current_user.id,
        filename=file.filename,
        status="processing",
    )
    db.add(statement)
    db.commit()
    db.refresh(statement)

    try:
        with pdfplumber.open(filepath) as pdf:
            full_text = "\n".join(
                page.extract_text() for page in pdf.pages if page.extract_text()
            )
        extracted = parse_statement_text(full_text)
        statement.status = "processed"
    except Exception:
        statement.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=422,
            detail="Could not extract transactions from this PDF. The format may not be supported yet.",
        )

    db.commit()

    return schemas.StatementUploadResponse(
        statement_id=statement.id,
        filename=statement.filename,
        transaction_count=len(extracted),
        transactions=[
            schemas.ExtractedTransactionOut(
                date=t.date, description=t.description,
                merchant=t.merchant, amount=t.amount, type=t.type,
            )
            for t in extracted
        ],
    )

# ... your existing imports, router setup, and upload_statement function stay unchanged ...

@router.post("/{statement_id}/confirm", response_model=schemas.ConfirmImportResponse)
def confirm_import(
    statement_id: int,
    payload: schemas.ConfirmImportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    statement = (
        db.query(models.Statement)
        .filter(models.Statement.id == statement_id, models.Statement.user_id == current_user.id)
        .first()
    )
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found.")

    created = []
    for t in payload.transactions:
        category_name, source = categorize_transaction(t.description)
        category = db.query(models.Category).filter(
            models.Category.name == category_name, models.Category.is_default == True
        ).first()

        txn = models.Transaction(
            user_id=current_user.id,
            statement_id=statement.id,
            date=datetime.strptime(t.date, "%Y-%m-%d").date(),
            description=t.description,
            merchant=t.merchant,
            amount=t.amount,
            type=t.type,
            category_id=category.id if category else None,
            category_source=source,
        )
        db.add(txn)
        created.append(txn)

    db.commit()
    for txn in created:
        db.refresh(txn)

    return schemas.ConfirmImportResponse(
        imported_count=len(created),
        transactions=[
            schemas.TransactionOut(
                id=t.id, date=t.date.isoformat(), description=t.description,
                merchant=t.merchant, amount=float(t.amount), type=t.type,
                category=t.category.name if t.category else None,
            )
            for t in created
        ],
    )