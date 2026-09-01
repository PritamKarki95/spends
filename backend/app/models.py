from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    transactions = relationship("Transaction", back_populates="user")
    statements = relationship("Statement", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    is_default = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # null = system default category

    transactions = relationship("Transaction", back_populates="category")


class Statement(Base):
    __tablename__ = "statements"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    upload_date = Column(DateTime, server_default=func.now())
    status = Column(String, default="pending")  # pending / processed / failed

    user = relationship("User", back_populates="statements")
    transactions = relationship("Transaction", back_populates="statement")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    statement_id = Column(Integer, ForeignKey("statements.id"), nullable=True)  # null = manual entry
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    date = Column(Date, nullable=False)
    description = Column(String, nullable=False)
    merchant = Column(String, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    type = Column(String, nullable=False)  # "debit" or "credit"
    category_source = Column(String, default="rule")  # rule / ml / user
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="transactions")
    statement = relationship("Statement", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    merchant = Column(String, nullable=False)
    avg_amount = Column(Numeric(10, 2), nullable=False)
    interval_days = Column(Integer, nullable=False)
    confidence = Column(Numeric(3, 2), nullable=True)  # 0.00–1.00
    detected_at = Column(DateTime, server_default=func.now())