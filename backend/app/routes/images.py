import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_database
from app.models import ImageGenerateRequest, ImageResponse
from app.auth import get_current_user
from app.services.huggingface import generate_image_from_prompt
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/images", tags=["Image Generation"])

@router.post("/generate", response_model=ImageResponse)
async def generate_image(request: ImageGenerateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
        
    try:
        session_oid = ObjectId(request.session_id)
    except Exception as e:
        logger.error(f"Failed to parse session ID '{request.session_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session ID format: '{request.session_id}'. Error: {str(e)}"
        )
        
    # Verify the session exists and belongs to the current user
    session = await db["chat_sessions"].find_one({
        "_id": session_oid,
        "user_id": current_user["_id"]
    })
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or access denied"
        )
        
    # Generate image
    try:
        image_url = await generate_image_from_prompt(request.prompt)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate image: {str(e)}"
        )
        
    now = datetime.now(timezone.utc)
    image_dict = {
        "session_id": session_oid,
        "user_id": current_user["_id"],
        "prompt": request.prompt,
        "image_url": image_url,
        "created_at": now
    }
    
    # Store in database
    result = await db["image_generations"].insert_one(image_dict)
    
    # Update session's updated_at timestamp to bring it to the top of list
    await db["chat_sessions"].update_one(
        {"_id": session_oid},
        {"$set": {"updated_at": now}}
    )
    
    new_image = await db["image_generations"].find_one({"_id": result.inserted_id})
    return new_image

@router.get("/session/{session_id}", response_model=List[ImageResponse])
async def get_session_images(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
        
    try:
        session_oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format"
        )
        
    # Verify the session exists and belongs to the user
    session = await db["chat_sessions"].find_one({
        "_id": session_oid,
        "user_id": current_user["_id"]
    })
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
        
    # Retrieve all images for the session (oldest first, like message sequence)
    cursor = db["image_generations"].find({"session_id": session_oid}).sort("created_at", 1)
    images = await cursor.to_list(length=100)
    return images

@router.get("/history", response_model=List[ImageResponse])
async def get_history(
    limit: int = 20,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
        
    # Retrieve user's image generation history (newest first, supports pagination)
    cursor = db["image_generations"].find({
        "user_id": current_user["_id"]
    }).sort("created_at", -1).skip(skip).limit(limit)
    
    images = await cursor.to_list(length=limit)
    return images
