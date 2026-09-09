"""
Simple spending forecast using a moving average of recent months.
"""

from statistics import mean

DEFAULT_WINDOW = 3


def forecast_next_month(
    monthly_totals: list[float], window: int = DEFAULT_WINDOW
) -> dict:
    if len(monthly_totals) == 0:
        return {"projection": None, "window_used": 0, "reason": "no historical data"}

    actual_window = min(window, len(monthly_totals))
    recent = monthly_totals[-actual_window:]
    projection = mean(recent)

    return {
        "projection": round(projection, 2),
        "window_used": actual_window,
        "months_used": recent,
    }


def evaluate_forecast_accuracy(
    monthly_totals: list[float], window: int = DEFAULT_WINDOW
) -> dict:
    if len(monthly_totals) <= window:
        return {
            "error": None,
            "reason": f"need more than {window} months of history to evaluate; have {len(monthly_totals)}",
        }

    errors = []
    for i in range(window, len(monthly_totals)):
        history = monthly_totals[:i]
        actual = monthly_totals[i]
        predicted = mean(history[-window:])
        errors.append(abs(predicted - actual))

    mae = mean(errors)
    avg_actual = mean(monthly_totals[window:])
    mae_percent = (mae / avg_actual * 100) if avg_actual > 0 else None

    return {
        "mean_absolute_error": round(mae, 2),
        "mean_absolute_error_percent": round(mae_percent, 1) if mae_percent else None,
        "months_evaluated": len(errors),
    }
