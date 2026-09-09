from datetime import date as calendar_date
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator


class TransactionInput(BaseModel):
    @field_validator('date', check_fields=False)
    @classmethod
    def valid_date(cls, value):
        calendar_date.fromisoformat(value)
        return value

    @field_validator('date', 'description', 'amount', 'type', check_fields=False, mode='before')
    @classmethod
    def non_null(cls, value):
        if value is None:
            raise ValueError('This field cannot be null')
        return value

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True  # lets Pydantic read directly from SQLAlchemy model objects

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ExtractedTransactionOut(BaseModel):
    date: str
    description: str
    merchant: str
    amount: float
    type: str


class StatementUploadResponse(BaseModel):
    statement_id: int
    filename: str
    transaction_count: int
    transactions: list[ExtractedTransactionOut]

class TransactionConfirm(TransactionInput):
    date: str
    description: str
    merchant: str
    amount: float = Field(ge=0, allow_inf_nan=False)
    type: Literal['debit', 'credit']


class ConfirmImportRequest(BaseModel):
    transactions: list[TransactionConfirm]
class TransactionOut(BaseModel):
    id: int
    date: str
    description: str
    merchant: str | None
    amount: float
    type: str
    category: str | None = None

    class Config:
        from_attributes = True

class ConfirmImportResponse(BaseModel):
    imported_count: int
    transactions: list[TransactionOut]

class TransactionCreate(TransactionInput):
    date: str
    description: str
    merchant: str | None = None
    amount: float = Field(ge=0, allow_inf_nan=False)
    type: Literal['debit', 'credit']


class TransactionUpdate(TransactionInput):
    date: str | None = None
    description: str | None = None
    merchant: str | None = None
    amount: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    type: Literal['debit', 'credit'] | None = None
    category_id: int | None = None 

class CategoryComparison(BaseModel):
    category: str
    current_amount: float
    previous_amount: float
    change: float
    percent_change: float | None  


class MonthComparisonResponse(BaseModel):
    current_month: str   # "2026-08"
    previous_month: str  # "2026-07"
    current_total: float
    previous_total: float
    total_change: float
    total_percent_change: float | None
    categories: list[CategoryComparison]  
