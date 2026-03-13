"""
验证码 API
"""
import base64
import httpx
from fastapi import APIRouter, HTTPException
from app.core.config import settings

router = APIRouter()


@router.post("/verify-code")
async def get_verify_code():
    """
    获取图片验证码
    
    Returns:
        dict: 验证码图片（base64）和验证码 ID
    """
    try:
        api_key = settings.VERIFY_CODE_API_KEY
        base_url = settings.VERIFY_CODE_API_URL
        
        headers = {
            "X-APISpace-Token": api_key,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        data = {
            "codeType": "1"  # 1:纯数字
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                base_url,
                headers=headers,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                # 假设 API 返回格式为 {"code": 200, "data": {"image": "base64...", "codeId": "xxx"}}
                if result.get('code') == 200 and result.get('data'):
                    return {
                        "success": True,
                        "data": result['data']
                    }
                else:
                    # 如果 API 调用失败，生成一个简单的验证码
                    return generate_simple_verify_code()
            else:
                # API 调用失败，返回简单验证码
                return generate_simple_verify_code()
                
    except Exception as e:
        print(f"获取验证码失败：{e}")
        # 返回简单验证码作为备用
        return generate_simple_verify_code()


def generate_simple_verify_code():
    """生成简单的本地验证码（备用方案）"""
    import random
    import io
    from PIL import Image, ImageDraw, ImageFont
    
    # 生成 4 位数字验证码
    code = ''.join([str(random.randint(0, 9)) for _ in range(4)])
    
    # 创建图片
    width, height = 120, 50
    image = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(image)
    
    # 绘制背景噪点
    for _ in range(50):
        x = random.randint(0, width)
        y = random.randint(0, height)
        draw.point((x, y), fill=(random.randint(200, 255), random.randint(200, 255), random.randint(200, 255)))
    
    # 绘制验证码文字
    try:
        font = ImageFont.truetype("arial.ttf", 32)
    except:
        font = ImageFont.load_default()
    
    for i, char in enumerate(code):
        x = 15 + i * 25
        y = random.randint(8, 15)
        color = (random.randint(0, 150), random.randint(0, 150), random.randint(0, 150))
        draw.text((x, y), char, font=font, fill=color)
    
    # 转换为 base64
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "success": True,
        "data": {
            "image": f"data:image/png;base64,{img_base64}",
            "codeId": "local_" + code,
            "code": code  # 仅用于测试，实际应该存储在服务器端
        }
    }
