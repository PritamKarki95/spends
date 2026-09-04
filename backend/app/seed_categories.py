"""
One-time seed script for default system categories.
Run manually: python -m app.seed_categories
"""
from app.database import SessionLocal
from app import models

DEFAULT_CATEGORIES = [
    "Food",
    "Shopping",
    "Transportation",
    "Entertainment",
    "Bills & Utilities",
    "Income",
    "Health",
    "Travel",
    "Other",
]

def seed():
    db = SessionLocal()
    try:
        for name in DEFAULT_CATEGORIES:
            exists = db.query(models.Category).filter(
                models.Category.name == name, models.Category.is_default == True
            ).first()
            if not exists:
                db.add(models.Category(name=name, is_default=True, user_id=None))
        db.commit()
        print(f"Seeded {len(DEFAULT_CATEGORIES)} default categories.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()