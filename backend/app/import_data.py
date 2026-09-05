import sys
import csv
from datetime import datetime
from pathlib import Path
from app.database import SessionLocal
from app import models
from app.services.pdf_parser import _normalize_merchant

CSV_PATH = Path(__file__).resolve().parent.parent / "demo_transactions.csv"


def main():
    if len(sys.argv) != 2:
        print("Usage: python -m app.import_data <user_email>")
        return

    email = sys.argv[1]
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print(f"No user found with email {email}")
            return

        with CSV_PATH.open(newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                category = db.query(models.Category).filter(
                    models.Category.name == row["category"], models.Category.is_default == True
                ).first()

                txn = models.Transaction(
                    user_id=user.id,
                    statement_id=None,
                    date=datetime.strptime(row["date"], "%Y-%m-%d").date(),
                    description=row["description"],
                    merchant=_normalize_merchant(row["description"]),
                    amount=float(row["amount"]),
                    type=row["type"],
                    category_id=category.id if category else None,
                    category_source="rule",
                )
                db.add(txn)
                count += 1

            db.commit()
            print(f"Imported {count} demo transactions for {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
