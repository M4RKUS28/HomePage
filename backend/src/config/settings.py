import logging
import os
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)


load_dotenv()


# Configuration for the application
# Password policy
# These settings are used to enforce password complexity requirements
MIN_PASSWORD_LENGTH = 3
REQUIRE_UPPERCASE = False
REQUIRE_LOWERCASE = False
REQUIRE_DIGIT = False
REQUIRE_SPECIAL_CHAR = False
SPECIAL_CHARACTERS_REGEX_PATTERN = r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~`]"


# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_please_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "2440"))


# Database settings
DB_USER = os.getenv("DB_USER", "your_db_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "your_db_password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306") # Default MySQL port
DB_NAME = os.getenv("DB_NAME", "your_app_db")

SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
# For SQLite (testing):
# SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
# For PostgreSQL:
# SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# DB Pooling Settings
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", 3600))
DB_POOL_PRE_PING = os.getenv("DB_POOL_PRE_PING", "true").lower() == "true"
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", 5))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", 10))
DB_CONNECT_TIMEOUT = int(os.getenv("DB_CONNECT_TIMEOUT", 10))  # Optional



# Email Configuration
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "your_email@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "your_email_password")
EMAIL_FROM = os.getenv("EMAIL_FROM", "your_email@gmail.com")
EMAIL_TO_ADMIN = os.getenv("EMAIL_TO_ADMIN", "admin@example.com")  # Main admin email to receive notifications
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "false").lower() == "true"