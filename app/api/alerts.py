from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.db.models import Alert, User, Binding
from app.schemas.alerts import AlertCreate, AlertResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/alerts", tags=["报警"])

@router.post("", response_model=AlertResponse)
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

@router.get("", response_model=List[AlertResponse])
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
    db_alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报警记录不存在"
        )
    
    # 验证权限：是本人，或者是绑定的家属
    has_permission = False
    if db_alert.user_id == current_user.id:
        has_permission = True
    elif current_user.user_type == "family":
        binding = db.query(Binding).filter(
            Binding.family_id == current_user.id,
            Binding.elder_id == db_alert.user_id,
            Binding.status == "confirmed"
        ).first()
        if binding:
            has_permission = True
            
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有权限修改此报警状态"
        )
    
    db_alert.status = status
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.get("/family/{family_member_id}", response_model=List[AlertResponse])
def get_family_member_alerts(family_member_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 获取该家庭成员绑定的所有老人
    bindings = db.query(Binding).filter(
        Binding.family_id == family_member_id,
        Binding.status == "confirmed"
    ).all()
    
    elder_ids = [binding.elder_id for binding in bindings]
    
    if not elder_ids:
        return []
        
    # 获取这些老人的报警
    alerts = db.query(Alert).filter(Alert.user_id.in_(elder_ids)).order_by(Alert.created_at.desc()).all()
    return alerts

@router.get("/all", response_model=List[AlertResponse])
def get_all_alerts(db: Session = Depends(get_db)):
    # 获取所有报警（不验证用户身份，用于演示）
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    return alerts