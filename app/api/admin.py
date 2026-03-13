from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.session import get_db
from app.db.models import User, Binding
from app.schemas.users import UserResponse, AdminUserResponse, BoundElderInfo
from datetime import datetime
from pydantic import BaseModel
import jwt
from passlib.context import CryptContext
from datetime import timedelta

router = APIRouter()

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 配置
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/admin/login", response_model=TokenResponse)
def admin_login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """管理员登录"""
    # 查找用户
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    if user.user_type != "admin":
        raise HTTPException(status_code=403, detail="普通用户无法访问管理后台")
    
    # 验证密码
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    # 创建 access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_type": user.user_type},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(access_token=access_token)

@router.get("/admin/users", response_model=List[AdminUserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """获取所有用户列表（管理后台）"""
    users = db.query(User).all()
    
    # 为每个用户添加绑定关系信息
    result = []
    for user in users:
        # 转换为字典
        user_dict = {
            'id': user.id,
            'username': user.username,
            'name': user.name,
            'phone': user.phone,
            'email': user.email,
            'user_type': user.user_type,
            'password_hash': user.password_hash,
            'elder_uid': user.elder_uid,
            'avatar': user.avatar,
            'is_active': user.is_active,
            'last_login': user.last_login,
            'created_at': user.created_at,
            'bound_elders': []
        }
        
        # 如果是子女用户，查询绑定的老人信息
        if user.user_type == 'family':
            bindings = db.query(Binding).filter(
                Binding.family_id == user.id,
                Binding.status == 'confirmed'
            ).all()
            
            for binding in bindings:
                elder = db.query(User).filter(User.id == binding.elder_id).first()
                if elder:
                    user_dict['bound_elders'].append({
                        'elder_id': elder.id,
                        'elder_name': elder.name,
                        'elder_uid': elder.elder_uid,
                        'relation': binding.relation,
                        'status': binding.status
                    })
        
        result.append(user_dict)
    
    return result

@router.get("/admin/users/{user_id}", response_model=AdminUserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """获取单个用户详情（管理后台）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

@router.delete("/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """删除用户"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    db.delete(user)
    db.commit()
    return {"message": "删除成功"}
