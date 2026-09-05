"""Identify likely recurring payments using amount and interval consistency."""

from collections import defaultdict
from statistics import mean, median, pstdev


INTERVAL_TARGET_DAYS = 30
INTERVAL_TOLERANCE_DAYS = 6


def detect_recurring(transactions):
    """Require three debits, amounts within 10%, and consistent monthly intervals.

    Confidence is a heuristic score, not a statistical probability.
    Transaction dates must be date objects, as supplied by the router.
    """
    merchants = defaultdict(list)
    for transaction in transactions:
        if transaction["type"] == "debit" and transaction["merchant"]:
            merchants[transaction["merchant"]].append(transaction)

    results = []
    for merchant, payments in merchants.items():
        if len(payments) < 3:
            continue
        payments.sort(key=lambda payment: payment["date"])
        amounts = [abs(float(payment["amount"])) for payment in payments]
        typical_amount = median(amounts)
        if typical_amount == 0:
            continue
        amount_deviation = max(abs(amount - typical_amount) / typical_amount for amount in amounts)
        amount_ok = amount_deviation <= 0.10

        gaps = [(later["date"] - earlier["date"]).days
                for earlier, later in zip(payments, payments[1:])]
        avg_interval = mean(gaps)
        interval_variation = pstdev(gaps)
        interval_ok = (
            all(gap > 0 for gap in gaps)
            and abs(avg_interval - INTERVAL_TARGET_DAYS) <= INTERVAL_TOLERANCE_DAYS
            and interval_variation <= INTERVAL_TOLERANCE_DAYS
        )
        if not (amount_ok and interval_ok):
            continue

        timing_deviation = mean(abs(gap - INTERVAL_TARGET_DAYS) / INTERVAL_TARGET_DAYS for gap in gaps)
        confidence = min(0.99, 0.70 + 0.05 * (len(payments) - 3))
        confidence -= amount_deviation + timing_deviation
        results.append({
            "merchant": merchant,
            "avg_amount": round(mean(amounts), 2),
            "interval_days": round(mean(gaps)),
            "confidence": round(max(0, confidence), 2),
        })

    return sorted(results, key=lambda result: (-result["confidence"], result["merchant"]))
