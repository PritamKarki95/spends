from collections import defaultdict
from statistics import mean, pstdev

MIN_OCCURRENCES = 3
AMOUNT_VARIATION_TOLERANCE = 0.15
INTERVAL_TARGET_DAYS = 30
INTERVAL_TOLERANCE_DAYS = 6


def detect_recurring(transactions: list[dict]) -> list[dict]:
    """
    transactions: list of {"merchant": str, "amount": float, "date": date, "type": str}
    Returns: list of {"merchant", "avg_amount", "interval_days", "confidence", "occurrences"}
    """
    by_merchant: dict[str, list[dict]] = defaultdict(list)
    for t in transactions:
        if t["type"] != "debit" or not t["merchant"]:
            continue
        by_merchant[t["merchant"]].append(t)

    results = []
    for merchant, txns in by_merchant.items():
        if len(txns) < MIN_OCCURRENCES:
            continue

        txns_sorted = sorted(txns, key=lambda t: t["date"])
        amounts = [t["amount"] for t in txns_sorted]
        avg_amount = mean(amounts)
        amount_variation = pstdev(amounts) / avg_amount if avg_amount > 0 else float("inf")

        intervals = [
            (txns_sorted[i]["date"] - txns_sorted[i - 1]["date"]).days
            for i in range(1, len(txns_sorted))
        ]
        avg_interval = mean(intervals)
        interval_variation = pstdev(intervals) if len(intervals) > 1 else 0

        amount_ok = amount_variation <= AMOUNT_VARIATION_TOLERANCE
        interval_ok = (
            abs(avg_interval - INTERVAL_TARGET_DAYS) <= INTERVAL_TOLERANCE_DAYS
            and interval_variation <= INTERVAL_TOLERANCE_DAYS
        )

        if amount_ok and interval_ok:
            amount_confidence = max(0, 1 - amount_variation / AMOUNT_VARIATION_TOLERANCE)
            interval_confidence = max(0, 1 - interval_variation / INTERVAL_TOLERANCE_DAYS)
            confidence = round((amount_confidence + interval_confidence) / 2, 2)

            results.append({
                "merchant": merchant,
                "avg_amount": round(avg_amount, 2),
                "interval_days": round(avg_interval),
                "confidence": confidence,
                "occurrences": len(txns_sorted),
            })

    results.sort(key=lambda r: r["confidence"], reverse=True)
    return results