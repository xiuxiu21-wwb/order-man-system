from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import httpx
import base64
import random
import io
import os
from PIL import Image
from app.core.config import settings

router = APIRouter()

class ImageRecognitionResponse(BaseModel):
    description: str
    confidence: float
    category: str = "居家物品"
    safety_level: str = "unknown"
    disclaimer: str = "识别结果仅供辅助确认，涉及药品、食品和安全风险时请再次人工核对。"

def analyze_image(image_bytes):
    """智能分析图片特征"""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert('RGB')
        
        width, height = img.size
        
        pixels = list(img.getdata())
        if not pixels:
            return None
        
        r_total = g_total = b_total = 0
        for pixel in pixels:
            r_total += pixel[0]
            g_total += pixel[1]
            b_total += pixel[2]
        
        num_pixels = len(pixels)
        avg_r = r_total // num_pixels
        avg_g = g_total // num_pixels
        avg_b = b_total // num_pixels
        
        brightness = (avg_r * 299 + avg_g * 587 + avg_b * 114) // 1000
        
        is_red_dominant = avg_r > avg_g + 30 and avg_r > avg_b + 30
        is_green_dominant = avg_g > avg_r + 30 and avg_g > avg_b + 30
        is_blue_dominant = avg_b > avg_r + 30 and avg_b > avg_g + 30
        is_bright = brightness > 150
        is_dark = brightness < 80
        
        color_variance = 0
        for pixel in pixels[:1000]:
            color_variance += (pixel[0] - avg_r) ** 2
            color_variance += (pixel[1] - avg_g) ** 2
            color_variance += (pixel[2] - avg_b) ** 2
        color_variance = color_variance // min(1000, num_pixels)
        is_colorful = color_variance > 5000
        
        return {
            'width': width,
            'height': height,
            'avg_r': avg_r,
            'avg_g': avg_g,
            'avg_b': avg_b,
            'brightness': brightness,
            'is_red_dominant': is_red_dominant,
            'is_green_dominant': is_green_dominant,
            'is_blue_dominant': is_blue_dominant,
            'is_bright': is_bright,
            'is_dark': is_dark,
            'is_colorful': is_colorful
        }
    except Exception as e:
        print(f"图片分析失败: {e}")
        return None

def get_smart_description(features):
    """根据图片特征智能生成描述"""
    if not features:
        return "这张图片看起来很有趣，让我帮您看看！"
    
    descriptions = []
    
    if features['is_green_dominant'] and features['is_bright']:
        descriptions.append("这可能是一片绿色的植物或草地，看起来很清新自然！")
        descriptions.append("看起来像是树叶或花草，给人很舒服的感觉！")
        descriptions.append("这是一片生机勃勃的绿色，像是大自然的颜色！")
    
    if features['is_red_dominant']:
        descriptions.append("这张图片有温暖的红色调，可能是花朵或喜庆的场景！")
        descriptions.append("红色看起来很鲜艳，可能是美丽的花朵！")
    
    if features['is_blue_dominant'] and features['is_bright']:
        descriptions.append("这可能是天空或海洋，蓝蓝的真漂亮！")
        descriptions.append("蓝色调让人感觉很宁静，像是天空或水面！")
    
    if features['is_colorful']:
        descriptions.append("这张图片色彩丰富，看起来很赏心悦目！")
        descriptions.append("五颜六色的，真漂亮！")
    
    if features['is_bright'] and not descriptions:
        descriptions.append("这张图片很明亮，看起来很舒服！")
        descriptions.append("光线很好，画面很清晰！")
    
    if features['is_dark'] and not descriptions:
        descriptions.append("这张图片比较暗，可能是夜晚或室内的场景！")
    
    general_descriptions = [
        "这是一张很有意思的图片！",
        "看起来很棒呢！",
        "这张照片拍得真不错！",
        "很有趣的画面！",
        "这看起来很温馨！"
    ]
    
    if not descriptions:
        descriptions = general_descriptions
    
    return random.choice(descriptions)

async def recognize_with_vision_model(image_bytes):
    """使用 OpenAI 兼容多模态 API 识别图片。

    API 地址、模型和密钥均从服务器环境变量读取，避免把密钥放进小程序或代码仓库。
    """
    try:
        # 直接读取环境变量，兼容服务器上被 .gitignore 忽略的 config.py。
        api_key = (os.getenv("VISION_API_KEY") or getattr(settings, "VISION_API_KEY", "") or "").strip()
        base_url = (os.getenv("VISION_API_URL") or getattr(settings, "VISION_API_URL", "https://api.qlhazycoder.top/v1") or "").strip().rstrip('/')
        model = (os.getenv("VISION_MODEL") or getattr(settings, "VISION_MODEL", "gpt-5.6-sol") or "").strip()
        if not api_key:
            print("未配置 VISION_API_KEY，跳过远程图片识别")
            return None, 0.3
        if not base_url or not model:
            print("VISION_API_URL 或 VISION_MODEL 未配置，跳过远程图片识别")
            return None, 0.3

        print(f"开始调用视觉模型：base_url={base_url}, model={model}")

        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": """你是家护伴的多模态居家安全助手，服务居家老人。请观察图片中的主体和环境风险。

重点检查：
1. 药品名称、包装和有效期是否能看清，但绝不猜测剂量或给出用药方案；
2. 食品名称、可见生产日期或保质期，以及明显腐败迹象；
3. 地面积水、杂物绊倒、通道堵塞、裸露电线、未关闭燃气灶或明火等风险；
4. 图片模糊或证据不足时明确说“无法确认”，不要编造。

请使用老人容易理解的短句，严格按以下格式输出：
看到的内容：
需要留意：
建议怎么做：

最后一行固定写：识别结果仅供辅助确认。"""
                        }
                    ]
                }
            ],
            "temperature": 0.7,
            "max_tokens": 200
        }
        
        print("发送图片识别请求...")
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            
            print(f"API 响应状态码：{response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"完整响应内容：{result}")
                
                if result.get('choices') and len(result['choices']) > 0:
                    choice = result['choices'][0]
                    print(f"Choice 内容：{choice}")
                    message = choice.get('message', {}) or {}
                    description = message.get('content', '')
                    if isinstance(description, list):
                        description = ''.join(
                            part.get('text', '') if isinstance(part, dict) else str(part)
                            for part in description
                        )
                    
                    if description:
                        print(f"识别结果：{description}")
                        return description, 0.95
            
            print("视觉模型未返回有效结果，使用安全兜底提示")
            return None, 0.8
            
    except Exception as e:
        print(f"视觉模型 API 调用失败：{e}")
        import traceback
        print(traceback.format_exc())
        return None, 0.8

@router.post("/recognize", response_model=ImageRecognitionResponse)
async def recognize_image(file: UploadFile = File(...)):
    """识别图片内容 - 使用配置的视觉模型，失败时返回保守提示。"""
    try:
        contents = await file.read()
        
        print(f"收到图片，大小：{len(contents)} 字节")
        
        api_description, api_confidence = await recognize_with_vision_model(contents)
        
        if api_description:
            return ImageRecognitionResponse(
                description=api_description,
                confidence=api_confidence
            )
        
        print("API 调用失败，使用本地分析...")
        features = analyze_image(contents)
        print(f"图片特征分析：{features}")
        
        description = get_smart_description(features)
        print(f"生成的描述：{description}")
        
        return ImageRecognitionResponse(
            description="图片信息不足，暂时无法可靠判断物品或居家风险，请在光线充足时重新拍摄。",
            confidence=0.3,
            category="无法确认",
            safety_level="unknown"
        )
                
    except Exception as e:
        print(f"图片识别异常：{e}")
        import traceback
        print(traceback.format_exc())
        return ImageRecognitionResponse(
            description="图片识别暂时不可用，请稍后重试；不要仅凭本次结果处理药品或安全风险。",
            confidence=0.0,
            category="识别失败",
            safety_level="unknown"
        )
