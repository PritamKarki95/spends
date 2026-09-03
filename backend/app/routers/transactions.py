from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.auth import get_current_user
from app import models, schemas

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[schemas.TransactionOut])
def list_transactions(
    search: str | None = Query(None),
    category_id: int | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    sort_by: str = Query("date"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)

    if search:
        query = query.filter(
            or_(
                models.Transaction.description.ilike(f"%{search}%"),
                models.Transaction.merchant.ilike(f"%{search}%"),
            )
        )

    if category_id is not None:
        query = query.filter(models.Transaction.category_id == category_id)

    if date_from:
        query = query.filter(models.Transaction.date >= datetime.strptime(date_from, "%Y-%m-%d").date())

    if date_to:
        query = query.filter(models.Transaction.date <= datetime.strptime(date_to, "%Y-%m-%d").date())

    sort_column = getattr(models.Transaction, sort_by, models.Transaction.date)
    query = query.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc())

    results = query.all()
    return [
        schemas.TransactionOut(
            id=t.id, date=t.date.isoformat(), description=t.description,
            merchant=t.merchant, amount=float(t.amount), type=t.type,
        )
        for t in results
    ]


@router.post("", response_model=schemas.TransactionOut, status_code=201)
def create_transaction(
    payload: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    txn = models.Transaction(
        user_id=current_user.id,
        statement_id=None,  # manual entry
        date=datetime.strptime(payload.date, "%Y-%m-%d").date(),
        description=payload.description,
        merchant=payload.merchant,
        amount=payload.amount,
        type=payload.type,
        category_source="user",
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return schemas.TransactionOut(
        id=txn.id, date=txn.date.isoformat(), description=txn.description,
        merchant=txn.merchant, amount=float(txn.amount), type=txn.type,
    )


@router.patch("/{transaction_id}", response_model=schemas.TransactionOut)
def update_transaction(
    transaction_id: int,
    payload: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    txn = (
        db.query(models.Transaction)
        .filter(models.Transaction.id == transaction_id, models.Transaction.user_id == current_user.id)
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if "date" in update_data:
        update_data["date"] = datetime.strptime(update_data["date"], "%Y-%m-%d").date()

    for field, value in update_data.items():
        setattr(txn, field, value)

    db.commit()
    db.refresh(txn)
    return schemas.TransactionOut(
        id=txn.id, date=txn.date.isoformat(), description=txn.description,
        merchant=txn.merchant, amount=float(txn.amount), type=txn.type,
    )


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    txn = (
        db.query(models.Transaction)
        .filter(models.Transaction.id == transaction_id, models.Transaction.user_id == current_user.id)
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    db.delete(txn)
    db.commit()