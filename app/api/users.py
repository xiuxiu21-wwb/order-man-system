from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.db.session import get_db
from app.db.models import User, Binding
from app.schemas.users import UserCreate, UserLogin, UserResponse, Token, UserUpdate, ChangePassword
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/users", tags=["用户"])

@router.get("/test")
def test_api():
    return {"message": "API is working", "register_url": "/api/users/register (POST)"}

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if user.username:
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )
    
    if user.phone:
        db_user = db.query(User).filter(User.phone == user.phone).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="手机号已被注册"
            )
    
    # 如果是老人注册，自动生成 UID
    elder_uid = None
    if user.user_type == "elder":
        # 生成唯一的老人 UID
        elder_uid = str(uuid.uuid4())
        # 检查是否已存在（理论上不会）
        while db.query(User).filter(User.elder_uid == elder_uid).first():
            elder_uid = str(uuid.uuid4())
    
    # 如果是子女注册且提供了老人 UID，检查 UID 是否存在
    if user.user_type == "family" and user.elder_uid:
        elder_user = db.query(User).filter(User.elder_uid == user.elder_uid).first()
        if not elder_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="老人 UID 不存在，请检查 UID 是否正确"
            )
        if elder_user.user_type != "elder":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该 UID 对应的不是老人账号"
            )
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        password_hash=hashed_password,
        name=user.name,
        phone=user.phone,
        email=user.email,
        user_type=user.user_type,
        elder_uid=elder_uid
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # 如果是子女注册且提供了老人 UID，创建绑定关系
    if user.user_type == "family" and user.elder_uid and elder_user:
        # 检查是否已经存在绑定关系
        existing_binding = db.query(Binding).filter(
            Binding.elder_id == elder_user.id,
            Binding.family_id == db_user.id
        ).first()
        
        if not existing_binding:
            # 创建新的绑定关系（待确认）
            binding = Binding(
                elder_id=elder_user.id,
                family_id=db_user.id,
                relation=user.relationship or "其他",
                status="confirmed"  # 自动确认绑定
            )
            db.add(binding)
            db.commit()
    
    return db_user

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        (User.username == user.login) | (User.phone == user.login)
    ).first()
    
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名/手机号或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用"
        )
    
    db_user.last_login = datetime.now()
    db.commit()
    
    access_token = create_access_token(data={"sub": str(db_user.id)})
    
    # 返回用户信息和 token
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "name": db_user.name,
            "phone": db_user.phone,
            "email": db_user.email,
            "user_type": db_user.user_type,
            "elder_uid": db_user.elder_uid,
            "avatar": db_user.avatar,
            "is_active": db_user.is_active,
            "last_login": db_user.last_login,
            "created_at": db_user.created_at
        }
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.phone is not None:
        existing = db.query(User).filter(
            User.phone == user_update.phone,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="手机号已被使用")
        current_user.phone = user_update.phone
    if user_update.email is not None:
        existing = db.query(User).filter(
            User.email == user_update.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="邮箱已被使用")
        current_user.email = user_update.email
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="原密码错误")
    
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "密码修改成功"}

@router.post("/create-default-user")
def create_default_user(db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == "elder").first()
    if not db_user:
        hashed_password = get_password_hash("123456")
        db_user = User(
            username="elder",
            password_hash=hashed_password,
            name="张大爷",
            phone="13800138000",
            user_type="elder"
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    
    db_user2 = db.query(User).filter(User.username == "family").first()
    if not db_user2:
        hashed_password = get_password_hash("123456")
        db_user2 = User(
            username="family",
            password_hash=hashed_password,
            name="张大爷子女",
            phone="13800138001",
            user_type="family"
        )
        db.add(db_user2)
        db.commit()
        db.refresh(db_user2)
    
    return {"message": "默认用户创建成功", "elder_user": "elder/123456", "family_user": "family/123456"}
