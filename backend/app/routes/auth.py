from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_database
from app.models import UserRegister, UserResponse, UserLogin, Token
from app.auth import get_password_hash, verify_password, create_access_token
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    
    # Normalize email to lower case
    email_lower = user_data.email.lower()
    
    # Check if user already exists (by email or username)
    existing_user = await db["users"].find_one({
        "$or": [
            {"email": email_lower},
            {"username": user_data.username}
        ]
    })
    if existing_user:
        if existing_user.get("email") == email_lower:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
            
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "username": user_data.username,
        "email": email_lower,
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db["users"].insert_one(user_dict)
    new_user = await db["users"].find_one({"_id": result.inserted_id})
    return new_user

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
        
    email_lower = credentials.email.lower()
    user = await db["users"].find_one({"email": email_lower})
    
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": str(user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}
