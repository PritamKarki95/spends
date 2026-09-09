from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app import models
from app.services.forecaster import forecast_next_month, evaluate_forecast_accuracy

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("")
def get_forecast(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    transactions = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.type == "debit",
        )
        .all()
    )

    monthly = defaultdict(float)
    for t in transactions:
        month_key = t.date.strftime("%Y-%m")
        monthly[month_key] += float(t.amount)

    months_sorted = sorted(monthly.keys())
    totals = [round(monthly[m], 2) for m in months_sorted]

    return {
        "monthly_history": dict(zip(months_sorted, totals)),
        "forecast": forecast_next_month(totals),
        "accuracy": evaluate_forecast_accuracy(totals),
    }
