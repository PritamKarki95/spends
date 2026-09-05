from calendar import monthrange
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth import get_current_user
from app import models, schemas

router = APIRouter(prefix="/comparisons", tags=["comparisons"])


def _month_totals_by_category(db: Session, user_id: int, year: int, month: int) -> dict[str, float]:
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])

    rows = (
        db.query(models.Category.name, func.sum(models.Transaction.amount))
        .join(models.Transaction, models.Transaction.category_id == models.Category.id)
        .filter(
            models.Transaction.user_id == user_id,
            models.Transaction.type == "debit",
            models.Transaction.date >= start,
            models.Transaction.date <= end,
        )
        .group_by(models.Category.name)
        .all()
    )
    return {name: float(total) for name, total in rows}


@router.get("/months/{year_a}/{month_a}/{year_b}/{month_b}", response_model=schemas.MonthComparisonResponse)
def compare_months(
    year_a: int, month_a: int, year_b: int, month_b: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Compares month A (current) against month B (previous). 
    """
    current_totals = _month_totals_by_category(db, current_user.id, year_a, month_a)
    previous_totals = _month_totals_by_category(db, current_user.id, year_b, month_b)

    all_categories = set(current_totals.keys()) | set(previous_totals.keys())

    comparisons = []
    for cat in all_categories:
        current_amt = current_totals.get(cat, 0.0)
        previous_amt = previous_totals.get(cat, 0.0)
        change = current_amt - previous_amt
        percent = (change / previous_amt * 100) if previous_amt > 0 else None

        comparisons.append(schemas.CategoryComparison(
            category=cat,
            current_amount=round(current_amt, 2),
            previous_amount=round(previous_amt, 2),
            change=round(change, 2),
            percent_change=round(percent, 1) if percent is not None else None,
        ))

    comparisons.sort(key=lambda c: abs(c.change), reverse=True)

    current_total = sum(current_totals.values())
    previous_total = sum(previous_totals.values())
    total_change = current_total - previous_total
    total_percent = (total_change / previous_total * 100) if previous_total > 0 else None

    return schemas.MonthComparisonResponse(
        current_month=f"{year_a:04d}-{month_a:02d}",
        previous_month=f"{year_b:04d}-{month_b:02d}",
        current_total=round(current_total, 2),
        previous_total=round(previous_total, 2),
        total_change=round(total_change, 2),
        total_percent_change=round(total_percent, 1) if total_percent is not None else None,
        categories=comparisons,
    )

@router.get("/months/{year_a}/{month_a}/{year_b}/{month_b}/category/{category_name}")
def compare_months_by_merchant(
    year_a: int, month_a: int, year_b: int, month_b: int, category_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Same comparison logic, scoped to one category, broken down by merchant."""
    def _merchant_totals(year: int, month: int) -> dict[str, float]:
        start = date(year, month, 1)
        end = date(year, month, monthrange(year, month)[1])
        rows = (
            db.query(models.Transaction.merchant, func.sum(models.Transaction.amount))
            .join(models.Category, models.Transaction.category_id == models.Category.id)
            .filter(
                models.Transaction.user_id == current_user.id,
                models.Transaction.type == "debit",
                models.Category.name == category_name,
                models.Transaction.date >= start,
                models.Transaction.date <= end,
            )
            .group_by(models.Transaction.merchant)
            .all()
        )
        return {merchant or "Unknown": float(total) for merchant, total in rows}

    current_totals = _merchant_totals(year_a, month_a)
    previous_totals = _merchant_totals(year_b, month_b)
    all_merchants = set(current_totals.keys()) | set(previous_totals.keys())

    results = []
    for merchant in all_merchants:
        current_amt = current_totals.get(merchant, 0.0)
        previous_amt = previous_totals.get(merchant, 0.0)
        change = current_amt - previous_amt
        percent = (change / previous_amt * 100) if previous_amt > 0 else None
        results.append(schemas.CategoryComparison(
            category=merchant,  # reusing the same schema shape, "category" field holds merchant name here
            current_amount=round(current_amt, 2),
            previous_amount=round(previous_amt, 2),
            change=round(change, 2),
            percent_change=round(percent, 1) if percent is not None else None,
        ))

    results.sort(key=lambda c: abs(c.change), reverse=True)
    return {"category": category_name, "merchants": results}


@router.get("/months/{year_a}/{month_a}/category/{category_name}/merchant/{merchant_name}")
def transactions_for_merchant(
    year_a: int, month_a: int, category_name: str, merchant_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """The bottom of the drill-down: actual transactions for one merchant, one month."""
    start = date(year_a, month_a, 1)
    end = date(year_a, month_a, monthrange(year_a, month_a)[1])

    transactions = (
        db.query(models.Transaction)
        .join(models.Category, models.Transaction.category_id == models.Category.id)
        .filter(
            models.Transaction.user_id == current_user.id,
            models.Category.name == category_name,
            models.Transaction.merchant == merchant_name,
            models.Transaction.date >= start,
            models.Transaction.date <= end,
        )
        .order_by(models.Transaction.date.desc())
        .all()
    )

    return [
        {
            "id": t.id,
            "date": t.date.isoformat(),
            "description": t.description,
            "amount": float(t.amount),
        }
        for t in transactions
    ]
