from app.services.anomaly_detector import detect_anomalies


def test_detects_clear_outlier():
    transactions = [
        {"id": i, "category": "Food", "amount": amt, "type": "debit"}
        for i, amt in enumerate([12, 15, 18, 14, 16, 13, 150])
    ]
    results = detect_anomalies(transactions)
    amounts_flagged = [t["amount"] for t in results]
    assert 150 in amounts_flagged


def test_no_anomalies_in_consistent_data():
    transactions = [
        {"id": i, "category": "Food", "amount": amt, "type": "debit"}
        for i, amt in enumerate([12, 15, 18, 14, 16, 13, 17])
    ]
    results = detect_anomalies(transactions)
    assert len(results) == 0
