from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app import models
from app.auth import get_current_user
from app.database import get_db
from app.services.anomaly_detector import detect_anomalies

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.get("")
def list_anomalies(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    transactions = (
        db.query(models.Transaction)
        .options(joinedload(models.Transaction.category))
        .filter(models.Transaction.user_id == current_user.id)
        .order_by(models.Transaction.date.desc(), models.Transaction.id.desc())
        .all()
    )
    return detect_anomalies(
        [
            {
                "id": t.id,
                "category": t.category.name if t.category else None,
                "amount": float(t.amount),
                "type": t.type,
                "description": t.description,
                "date": t.date.isoformat(),
            }
            for t in transactions
        ]
    )
