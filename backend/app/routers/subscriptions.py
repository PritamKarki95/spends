from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app import models
from app.services.recurring_detector import detect_recurring

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("/detect")
def run_detection(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):

    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .all()
    )

    txn_dicts = [
        {"merchant": t.merchant, "amount": float(t.amount), "date": t.date, "type": t.type}
        for t in transactions
    ]

    detected = detect_recurring(txn_dicts)

    db.query(models.Subscription).filter(models.Subscription.user_id == current_user.id).delete()

    for d in detected:
        db.add(models.Subscription(
            user_id=current_user.id,
            merchant=d["merchant"],
            avg_amount=d["avg_amount"],
            interval_days=d["interval_days"],
            confidence=d["confidence"],
        ))
    db.commit()

    return {"detected_count": len(detected), "subscriptions": detected}


@router.get("")
def list_subscriptions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    subs = (
        db.query(models.Subscription)
        .filter(models.Subscription.user_id == current_user.id)
        .order_by(models.Subscription.confidence.desc())
        .all()
    )
    return [
        {
            "id": s.id, "merchant": s.merchant, "avg_amount": float(s.avg_amount),
            "interval_days": s.interval_days, "confidence": float(s.confidence) if s.confidence else None,
        }
        for s in subs
    ]