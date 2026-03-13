from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime, timedelta
from app.db.session import get_db
from app.db.models import Location, User
from app.schemas.locations import LocationCreate, LocationResponse, LocationHistory
from app.core.security import get_current_user
from app.services.map_service import map_service

router = APIRouter()

@router.post("/", response_model=LocationResponse)
def create_location(location: LocationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 自动获取地址信息
    address = location.address
    if not address:
        try:
            result = map_service.reverse_geocode(location.latitude, location.longitude)
            if result.get("status") == "1":
                address = result.get("regeocode", {}).get("formatted_address", "")
        except Exception as e:
            print(f"获取地址失败: {e}")
    
    # 创建位置记录
    db_location = Location(
        user_id=current_user.id,
        latitude=location.latitude,
        longitude=location.longitude,
        accuracy=location.accuracy,
        address=address
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@router.get("/current", response_model=LocationResponse)
def get_current_location(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 获取用户最新位置
    location = db.query(Location).filter(Location.user_id == current_user.id).order_by(desc(Location.timestamp)).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到位置信息"
        )
    return location

@router.get("/history", response_model=List[LocationHistory])
def get_location_history(
    start_time: datetime,
    end_time: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 获取指定时间范围内的位置历史
    locations = db.query(Location).filter(
        Location.user_id == current_user.id,
        Location.timestamp >= start_time,
        Location.timestamp <= end_time
    ).order_by(Location.timestamp).all()
    return locations

@router.get("/family/{family_member_id}", response_model=LocationResponse)
def get_family_member_location(
    family_member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 验证是否为家庭成员
    # 这里需要添加家庭关系验证逻辑
    
    # 获取家庭成员最新位置
    location = db.query(Location).filter(Location.user_id == family_member_id).order_by(desc(Location.timestamp)).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到位置信息"
        )
    return location