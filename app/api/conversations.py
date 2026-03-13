from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Conversation, User
from app.schemas.conversations import ConversationCreate, ConversationResponse
from app.core.security import get_current_user
from app.services.ai_assistant import get_ai_response, get_ai_response_async

router = APIRouter()

class SimpleChatRequest(BaseModel):
    message: str

class SimpleChatResponse(BaseModel):
    response: str

class VoiceRecognitionResponse(BaseModel):
    text: str

@router.post("/chat", response_model=SimpleChatResponse)
async def simple_chat(request: SimpleChatRequest):
    """简单的聊天接口，不需要登录"""
    ai_response = await get_ai_response_async(request.message)
    return SimpleChatResponse(response=ai_response)

@router.post("/voice", response_model=VoiceRecognitionResponse)
async def recognize_voice(voice: UploadFile = File(...)):
    """语音识别接口 - 占位实现"""
    try:
        contents = await voice.read()
        
        print(f"收到语音文件，大小: {len(contents)} 字节")
        
        return VoiceRecognitionResponse(
            text="抱歉，语音识别功能暂时不可用，请使用文字输入。"
        )
    except Exception as e:
        print(f"语音识别异常: {e}")
        return VoiceRecognitionResponse(
            text="抱歉，语音识别功能暂时不可用，请使用文字输入。"
        )

@router.post("/", response_model=ConversationResponse)
async def create_conversation(conversation: ConversationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ai_response = await get_ai_response_async(conversation.message)
    
    db_conversation = Conversation(
        user_id=current_user.id,
        message=conversation.message,
        response=ai_response
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

@router.get("/", response_model=List[ConversationResponse])
def get_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversations = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.timestamp.desc()).all()
    return conversations
