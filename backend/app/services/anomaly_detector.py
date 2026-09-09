"""
Statistical anomaly detection using IQR (interquartile range) per category.

KNOWN LIMITATION: category-level baselines can mix sub-patterns (e.g.
"Entertainment" mixing cheap subscriptions with pricier one-off
purchases), which can cause false positives for a merchant whose
typical price sits outside the category's usual range. A per-merchant
baseline would be more precise but requires enough repeat transactions
per merchant to be reliable — a real tradeoff, not solved here.
"""

from statistics import median

MIN_BASELINE_SIZE = 5


def _quartiles(sorted_values: list[float]) -> tuple[float, float]:
    n = len(sorted_values)
    mid = n // 2
    lower_half = sorted_values[:mid]
    upper_half = sorted_values[mid + 1 :] if n % 2 else sorted_values[mid:]
    q1 = median(lower_half)
    q3 = median(upper_half)
    return q1, q3


def detect_anomalies(transactions: list[dict]) -> list[dict]:
    """
    transactions: list of {"id": int, "category": str, "amount": float, "type": str, "description": str, "date": ...}
    Returns anomalous transactions (subset of input) with baseline info attached.
    """
    by_category: dict[str, list[dict]] = {}
    for t in transactions:
        if t["type"] != "debit" or not t["category"]:
            continue
        by_category.setdefault(t["category"], []).append(t)

    anomalies = []
    for category, txns in by_category.items():
        if len(txns) < MIN_BASELINE_SIZE + 1:
            continue

        amounts_sorted = sorted(t["amount"] for t in txns)
        q1, q3 = _quartiles(amounts_sorted)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        for t in txns:
            if t["amount"] < lower_bound or t["amount"] > upper_bound:
                anomalies.append(
                    {
                        **t,
                        "category_median": round(median(amounts_sorted), 2),
                        "category_typical_range": [round(q1, 2), round(q3, 2)],
                    }
                )

    return anomalies
