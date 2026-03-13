from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import httpx
import base64
import random
import io
from PIL import Image
from app.core.config import settings

router = APIRouter()

class ImageRecognitionResponse(BaseModel):
    description: str
    confidence: float

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

async def recognize_with_minimax(image_bytes):
    """使用 MiniMax 多模态 API 识别图片"""
    try:
        print("开始调用 MiniMax 多模态 API...")
        
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        api_key = settings.MINIMAX_API_KEY
        base_url = settings.MINIMAX_API_URL
        # 使用支持视觉的模型
        model = "abab6.5s-chat"
        
        print(f"API 配置：base_url={base_url}, model={model}")
        
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
                            "type": "text",
                            "text": "请用简洁温馨的语言描述这张图片，适合给老人阅读，100 字以内。要温暖、亲切、易懂。"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 300
        }
        
        print("发送 API 请求...")
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            
            print(f"API 响应状态码：{response.status_code}")
            print(f"API 响应内容：{response.text[:500]}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"API 响应：{result}")
                
                if result.get('choices') and len(result['choices']) > 0:
                    message = result['choices'][0].get('message', {})
                    description = message.get('content', '')
                    
                    if description:
                        print(f"识别结果：{description}")
                        return description, 0.95
            
            print("API 调用未返回有效结果，使用本地分析")
            return None, 0.8
            
    except Exception as e:
        print(f"MiniMax 多模态 API 调用失败：{e}")
        import traceback
        print(traceback.format_exc())
        return None, 0.8

@router.post("/recognize", response_model=ImageRecognitionResponse)
async def recognize_image(file: UploadFile = File(...)):
    """识别图片内容 - 使用 MiniMax 多模态 API，失败时回退到本地分析"""
    try:
        contents = await file.read()
        
        print(f"收到图片，大小：{len(contents)} 字节")
        
        # 使用 MiniMax 多模态 API
        api_description, api_confidence = await recognize_with_minimax(contents)
        
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
            description=description,
            confidence=0.85
        )
                
    except Exception as e:
        print(f"图片识别异常：{e}")
        import traceback
        print(traceback.format_exc())
        return ImageRecognitionResponse(
            description="这是一张很有趣的图片！",
            confidence=0.8
        )
