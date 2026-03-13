from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.db.models import Alert, User
from app.schemas.alerts import AlertCreate, AlertResponse
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=AlertResponse)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 创建报警
    db_alert = Alert(
        user_id=current_user.id,
        alert_type=alert.alert_type,
        message=alert.message,
        latitude=alert.latitude,
        longitude=alert.longitude,
        status="pending"
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.get("/", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    # 获取所有报警（临时用于演示）
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    return alerts

@router.get("/user/{user_id}", response_model=List[AlertResponse])
def get_user_alerts(user_id: int, db: Session = Depends(get_db)):
    # 获取特定用户的报警
    alerts = db.query(Alert).filter(Alert.user_id == user_id).order_by(Alert.created_at.desc()).all()
    return alerts

@router.put("/{alert_id}/status")
def update_alert_status(alert_id: int, status: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 更新报警状态
    db_alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if not db_alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报警记录不存在"
        )
    
    db_alert.status = status
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.get("/family/{family_member_id}", response_model=List[AlertResponse])
def get_family_member_alerts(family_member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 验证是否为家庭成员
    # 这里需要添加家庭关系验证逻辑
    
    # 获取家庭成员的报警
    alerts = db.query(Alert).filter(Alert.user_id == family_member_id).order_by(Alert.created_at.desc()).all()
    return alerts

@router.get("/all", response_model=List[AlertResponse])
def get_all_alerts(db: Session = Depends(get_db)):
    # 获取所有报警（不验证用户身份，用于演示）
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    return alerts