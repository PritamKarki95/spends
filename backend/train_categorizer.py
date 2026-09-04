from app.database import SessionLocal
from app import models
from app.services.ml_categorizer import train

MIN_EXAMPLES_PER_CATEGORY = 5
MIN_TOTAL_EXAMPLES = 50


def main():
    db = SessionLocal()
    try:
        transactions = (
            db.query(models.Transaction)
            .filter(models.Transaction.category_id.isnot(None))
            .all()
        )

        descriptions = [t.description for t in transactions]
        categories = [t.category.name for t in transactions]

        if len(descriptions) < MIN_TOTAL_EXAMPLES:
            print(
                f"Only {len(descriptions)} categorized transactions found — "
                f"need at least {MIN_TOTAL_EXAMPLES}. Skipping training."
            )
            return

        from collections import Counter
        counts = Counter(categories)
        thin = [c for c, n in counts.items() if n < MIN_EXAMPLES_PER_CATEGORY]
        if thin:
            print(f"Warning: these categories have very few examples: {thin}")

        result = train(descriptions, categories)

        print(f"\nTrained on {result['train_size']} examples, tested on {result['test_size']}")
        print(f"Test accuracy: {result['accuracy']:.2%}")
        print("\nPer-category performance:")
        print(result["report"])

    finally:
        db.close()


if __name__ == "__main__":
    main()