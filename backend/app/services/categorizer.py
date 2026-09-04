"""
Rule-based transaction categorization.

Maps recognizable keywords in a transaction's description to a category
name. This is the baseline categorizer — a future ML model (TF-IDF +
Logistic Regression) trains on this data plus user corrections.
"""

RULES: dict[str, str] = {
    "MCDONALD": "Food", "WENDYS": "Food", "CHIPOTLE": "Food",
    "STARBUCKS": "Food", "DOORDASH": "Food", "UBER EATS": "Food",
    "RESTAURANT": "Food", "GRUBHUB": "Food",

    "WALMART": "Shopping", "TARGET": "Shopping", "AMAZON": "Shopping",
    "BEST BUY": "Shopping", "COSTCO": "Shopping",

    "SHELL": "Transportation", "CHEVRON": "Transportation", "EXXON": "Transportation",
    "76": "Transportation", "MOBIL": "Transportation", "CIRCLE K": "Transportation",
    "UBER TRIP": "Transportation", "LYFT": "Transportation", "PARKING": "Transportation",
    "GAS": "Transportation",

    "NETFLIX": "Entertainment", "SPOTIFY": "Entertainment", "HULU": "Entertainment",
    "DISNEY": "Entertainment", "AMC": "Entertainment", "STEAM": "Entertainment",

    "ADOBE": "Bills & Utilities", "COMCAST": "Bills & Utilities", "AT&T": "Bills & Utilities",
    "VERIZON": "Bills & Utilities", "ELECTRIC": "Bills & Utilities", "WATER BILL": "Bills & Utilities",

    "PAYROLL": "Income", "DEPOSIT": "Income", "SALARY": "Income",

    "PHARMACY": "Health", "CVS": "Health", "WALGREENS": "Health", "CLINIC": "Health",

    "AIRLINE": "Travel", "HOTEL": "Travel", "AIRBNB": "Travel",
}


def categorize(description: str) -> str:
    """Return a category name for a transaction description, or 'Other' if no rule matches."""
    upper_desc = description.upper()
    for keyword, category in RULES.items():
        if keyword in upper_desc:
            return category
    return "Other"
