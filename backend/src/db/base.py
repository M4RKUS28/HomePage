"""
Declarative base for all SQLAlchemy ORM models.

Every model module imports ``Base`` from here so that
``Base.metadata`` always contains every table definition.
"""

from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass


class Base(DeclarativeBase):
    """
    Application-wide declarative base.

    Using the modern ``DeclarativeBase`` approach (SQLAlchemy ≥ 2.0).
    """
    pass
