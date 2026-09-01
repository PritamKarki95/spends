"""
PDF statement parsing.

Design: each bank/layout gets its own parser class implementing a common
interface (`parse`). This keeps adding support for a new statement format
isolated to one new class, rather than branching logic inside one giant
function.
"""
import re
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ExtractedTransaction:
    date: str          # ISO format, e.g. "2026-08-01"
    description: str
    merchant: str
    amount: float
    type: str           # "debit" or "credit"


class BaseStatementParser:
    """Common interface every parser profile implements."""

    def can_parse(self, text: str) -> bool:
        """Return True if this parser recognizes the statement's format."""
        raise NotImplementedError

    def parse(self, text: str) -> list[ExtractedTransaction]:
        raise NotImplementedError


class GenericLineParser(BaseStatementParser):
    """
    Handles statements where each transaction is one text line in the form:
        MM/DD/YYYY   Description text   [+-]$amount.cc
    This covers statements without drawn table gridlines (the common case
    when pdfplumber's extract_table() returns nothing useful).
    """

    LINE_PATTERN = re.compile(
        r'^(\d{2}/\d{2}/\d{4})\s+(.+?)\s+([+-]\$[\d,]+\.\d{2})$'
    )

    def can_parse(self, text: str) -> bool:
        return any(self.LINE_PATTERN.match(line.strip()) for line in text.split('\n'))

    def parse(self, text: str) -> list[ExtractedTransaction]:
        transactions = []
        for line in text.split('\n'):
            match = self.LINE_PATTERN.match(line.strip())
            if not match:
                continue

            date_str, description, amount_str = match.groups()
            is_debit = amount_str.startswith('-')
            amount = float(amount_str.replace('$', '').replace('+', '').replace('-', '').replace(',', ''))
            iso_date = datetime.strptime(date_str, '%m/%d/%Y').strftime('%Y-%m-%d')
            description = description.strip()

            transactions.append(ExtractedTransaction(
                date=iso_date,
                description=description,
                merchant=_normalize_merchant(description),
                amount=amount,
                type='debit' if is_debit else 'credit',
            ))
        return transactions


def _normalize_merchant(description: str) -> str:
    """
    Rough merchant-name cleanup: strip trailing reference numbers/codes,
    collapse repeated whitespace. Good enough for grouping in Phase 9/12;
    can be refined later without touching the parsing layer above it.
    """
    cleaned = re.sub(r'#\d+', '', description)
    cleaned = re.sub(r'\*[A-Z0-9]+$', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


PARSERS: list[BaseStatementParser] = [
    GenericLineParser(),
]


def parse_statement_text(text: str) -> list[ExtractedTransaction]:
    """Try each registered parser until one recognizes the format."""
    for parser in PARSERS:
        if parser.can_parse(text):
            return parser.parse(text)
    raise ValueError("No parser could recognize this statement's format.")