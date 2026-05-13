from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.models import Chat
from app.schemas.chat import ChatCreate, ChatUpdate, ChatResponse

router = APIRouter(prefix="/api/chats", tags=["chats"])


@router.get("", response_model=List[ChatResponse])
async def list_chats(customer_id: int = None, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """채팅 목록"""
    query = select(Chat)
    if customer_id:
        query = query.where(Chat.customer_id == customer_id)

    result = await db.execute(query.offset(skip).limit(limit))
    chats = result.scalars().all()
    return chats


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(chat_id: int, db: AsyncSession = Depends(get_db)):
    """채팅 상세"""
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="채팅을 찾을 수 없습니다")
    return chat


@router.post("", response_model=ChatResponse)
async def create_chat(chat: ChatCreate, db: AsyncSession = Depends(get_db)):
    """새 채팅 생성"""
    db_chat = Chat(**chat.dict())
    db.add(db_chat)
    await db.commit()
    await db.refresh(db_chat)
    return db_chat


@router.put("/{chat_id}", response_model=ChatResponse)
async def update_chat(chat_id: int, chat: ChatUpdate, db: AsyncSession = Depends(get_db)):
    """채팅 수정"""
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    db_chat = result.scalar_one_or_none()
    if not db_chat:
        raise HTTPException(status_code=404, detail="채팅을 찾을 수 없습니다")

    update_data = chat.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_chat, key, value)

    db.add(db_chat)
    await db.commit()
    await db.refresh(db_chat)
    return db_chat
