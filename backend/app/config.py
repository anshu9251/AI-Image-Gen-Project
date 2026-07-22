import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    port: int = Field(default=7860, validation_alias="PORT")
    mongo_uri: str = Field(default="mongodb://localhost:27017/ai_image_gen", validation_alias="MONGO_URI")
    jwt_secret: str = Field(default="your_jwt_secret_key_here", validation_alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=1440, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    hf_api_key: str = Field(default="", validation_alias="HF_API_KEY")
    cf_account_id: str = Field(default="", validation_alias="CF_ACCOUNT_ID")
    cf_api_token: str = Field(default="", validation_alias="CF_API_TOKEN")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()