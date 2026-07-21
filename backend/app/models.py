from typing import Annotated, Optional, List
from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from datetime import datetime

# Maps BSON ObjectId to string representation
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "60c72b2f9b1d8e2b8c8b4567",
                "username": "johndoe",
                "email": "johndoe@example.com",
                "created_at": "2026-07-20T12:00:00"
            }
        }

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

class SessionCreate(BaseModel):
    title: str

class SessionResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    title: str
    user_id: PyObjectId
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

class ImageGenerateRequest(BaseModel):
    session_id: str
    prompt: str

class ImageResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    session_id: PyObjectId
    user_id: PyObjectId
    prompt: str
    image_url: str  # Base64 encoded string containing the image data
    created_at: datetime

    class Config:
        populate_by_name = True
