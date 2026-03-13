from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: Optional[str] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    user_type: str  # elder, family

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    elder_uid: Optional[str] = None  # 子女注册时输入的老人 UID
    family_id: Optional[int] = None
    relationship: Optional[str] = None
    is_primary: bool = False

class UserLogin(BaseModel):
    login: str  # username or phone
    password: str

class UserResponse(UserBase):
    id: int
    elder_uid: Optional[str] = None  # 老人 UID
    avatar: Optional[str] = None
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class BoundElderInfo(BaseModel):
    """绑定的老人信息"""
    elder_id: int
    elder_name: str
    elder_uid: str
    relation: str  # 与子女的关系
    status: str  # 绑定状态

class AdminUserResponse(UserBase):
    """管理后台用户响应，包含密码哈希"""
    id: int
    password_hash: Optional[str] = None  # 密码哈希值（仅管理后台可见）
    elder_uid: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime
    bound_elders: Optional[List[BoundElderInfo]] = []  # 子女绑定的老人列表
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
