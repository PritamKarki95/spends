from pydantic import BaseModel, EmailStr

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

class TransactionConfirm(BaseModel):
    date: str
    description: str
    merchant: str
    amount: float
    type: str


class ConfirmImportRequest(BaseModel):
    transactions: list[TransactionConfirm]


class TransactionOut(BaseModel):
    id: int
    date: str
    description: str
    merchant: str | None
    amount: float
    type: str

    class Config:
        from_attributes = True


class ConfirmImportResponse(BaseModel):
    imported_count: int
    transactions: list[TransactionOut]