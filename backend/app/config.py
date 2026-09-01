from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "SpendS API"
    environment: str = "development"
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 60

    class Config:
        env_file = ".env"

settings = Settings()