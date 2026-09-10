from app.services.categorizer import categorize


def test_categorize_known_merchant():
    assert categorize("MCDONALDS #2291") == "Food"
    assert categorize("WALMART #4211") == "Shopping"
    assert categorize("SHELL OIL 57482910") == "Transportation"


def test_categorize_unknown_merchant_returns_other():
    assert categorize("SOME RANDOM UNKNOWN MERCHANT XYZ") == "Other"


def test_categorize_is_case_insensitive():
    assert categorize("mcdonalds drive thru") == "Food"
