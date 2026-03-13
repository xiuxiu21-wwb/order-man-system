"""
绑定关系 API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.db.models import User, Binding
from pydantic import BaseModel

router = APIRouter(prefix="/bindings", tags=["绑定关系"])


class BindRequest(BaseModel):
    family_id: int
    elder_uid: str
    relation: str = "其他"


class BindResponse(BaseModel):
    success: bool
    message: str = ""
    data: dict = None


@router.post("/bind", response_model=BindResponse)
def bind_elder(request: BindRequest, db: Session = Depends(get_db)):
    """
    子女绑定老人
    """
    try:
        # 查找老人
        elder = db.query(User).filter(User.elder_uid == request.elder_uid).first()
        if not elder:
            raise HTTPException(status_code=400, detail="老人 UID 不存在")
        
        if elder.user_type != "elder":
            raise HTTPException(status_code=400, detail="该 UID 对应的不是老人账号")
        
        # 查找子女
        family = db.query(User).filter(User.id == request.family_id).first()
        if not family:
            raise HTTPException(status_code=400, detail="子女账号不存在")
        
        if family.user_type != "family":
            raise HTTPException(status_code=400, detail="该账号不是子女账号")
        
        # 检查是否已绑定
        existing = db.query(Binding).filter(
            Binding.elder_id == elder.id,
            Binding.family_id == family.id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="已绑定该老人")
        
        # 检查子女已绑定的老人数量
        bound_count = db.query(Binding).filter(Binding.family_id == family.id).count()
        if bound_count >= 3:
            raise HTTPException(status_code=400, detail="最多只能绑定 3 位老人")
        
        # 创建绑定关系
        binding = Binding(
            elder_id=elder.id,
            family_id=family.id,
            relation=request.relation,
            status="confirmed"
        )
        db.add(binding)
        db.commit()
        
        return BindResponse(
            success=True,
            message="绑定成功",
            data={
                "id": binding.id,
                "elder_id": elder.id,
                "elder_uid": elder.elder_uid,
                "elder_name": elder.name
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/family/{family_id}")
def get_bound_elders(family_id: int, db: Session = Depends(get_db)):
    """
    获取子女绑定的所有老人
    """
    try:
        bindings = db.query(Binding).filter(Binding.family_id == family_id).all()
        
        elders = []
        for binding in bindings:
            elder = db.query(User).filter(User.id == binding.elder_id).first()
            if elder:
                elders.append({
                    "id": binding.id,
                    "elder_id": elder.id,
                    "name": elder.name,
                    "elder_uid": elder.elder_uid,
                    "relation": binding.relation,
                    "status": binding.status
                })
        
        return {"success": True, "data": elders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{binding_id}")
def unbind_elder(binding_id: int, db: Session = Depends(get_db)):
    """
    解绑老人
    """
    try:
        binding = db.query(Binding).filter(Binding.id == binding_id).first()
        if not binding:
            raise HTTPException(status_code=404, detail="绑定关系不存在")
        
        db.delete(binding)
        db.commit()
        
        return {"success": True, "message": "解绑成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
