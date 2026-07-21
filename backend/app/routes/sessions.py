from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_database
from app.models import SessionCreate, SessionResponse
from app.auth import get_current_user
from datetime import datetime, timezone
from bson import ObjectId
from typing import List

router = APIRouter(prefix="/sessions", tags=["Chat Sessions"])

@router.get("", response_model=List[SessionResponse])
async def get_sessions(current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
         raise HTTPException(status_code=500, detail="Database connection not available")
    
    # Fetch all sessions for current user, sorted by updated_at (most recent first)
    cursor = db["chat_sessions"].find({"user_id": current_user["_id"]}).sort("updated_at", -1)
    sessions = await cursor.to_list(length=100)
    return sessions

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(session_data: SessionCreate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
         raise HTTPException(status_code=500, detail="Database connection not available")
         
    now = datetime.now(timezone.utc)
    session_dict = {
        "title": session_data.title,
        "user_id": current_user["_id"],
        "created_at": now,
        "updated_at": now
    }
    
    result = await db["chat_sessions"].insert_one(session_dict)
    new_session = await db["chat_sessions"].find_one({"_id": result.inserted_id})
    return new_session

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
         raise HTTPException(status_code=500, detail="Database connection not available")
         
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
        
    session = await db["chat_sessions"].find_one({"_id": oid, "user_id": current_user["_id"]})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session

@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(session_id: str, session_data: SessionCreate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
         raise HTTPException(status_code=500, detail="Database connection not available")
         
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
        
    result = await db["chat_sessions"].update_one(
        {"_id": oid, "user_id": current_user["_id"]},
        {"$set": {"title": session_data.title, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
    updated_session = await db["chat_sessions"].find_one({"_id": oid})
    return updated_session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
         raise HTTPException(status_code=500, detail="Database connection not available")
         
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
        
    # Verify ownership and delete the session
    result = await db["chat_sessions"].delete_one({"_id": oid, "user_id": current_user["_id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
    # Cascading delete: Remove all images associated with this session
    await db["image_generations"].delete_many({"session_id": oid})
    
    return None
