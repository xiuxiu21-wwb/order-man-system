from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import base64
import httpx
import re
import os
from typing import Optional, List
import json
from app.core.config import settings

router = APIRouter()

class MedicationOCRResponse(BaseModel):
    name: Optional[str] = None
    frequency: Optional[str] = None
    dosage: Optional[str] = None
    times: List[str] = []
    duration_days: Optional[int] = None
    raw_text: Optional[str] = None

@router.post("/medication-ocr", response_model=MedicationOCRResponse)
async def recognize_medication_label(file: UploadFile = File(...)):
    """
    药品说明书 OCR 识别接口
    使用服务器配置的 OpenAI 兼容视觉模型
    """
    try:
        image_data = await file.read()
        print(f"收到药品说明书图片，大小：{len(image_data)} 字节")
        
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        api_key = (os.getenv("VISION_API_KEY") or getattr(settings, "VISION_API_KEY", "") or "").strip()
        base_url = (os.getenv("VISION_API_URL") or getattr(settings, "VISION_API_URL", "https://api.qlhazycoder.top/v1") or "").strip().rstrip('/')
        model = (os.getenv("VISION_MODEL") or getattr(settings, "VISION_MODEL", "gpt-5.6-sol") or "").strip()

        if not api_key:
            return MedicationOCRResponse(raw_text="视觉服务尚未配置", name="识别失败")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "stream": False,
            "messages": [
                {
                    "role": "system",
                    "content": "你是一个专业的 OCR 信息提取助手。你的唯一任务是：识别图片中的文字，并严格按照 JSON 格式输出。你不能说任何其他话，只能返回 JSON 数据。"
                },
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
                            "text": """识别这张药品说明书图片，提取信息并返回 JSON：

格式：{"药品名称": "xxx", "服用频次": "一日 X 次", "服用说明": "xxx", "服用天数": 数字或null}

要求：
1. 药品名称：找最大的字、标题，必须填写
2. 服用频次：只能是"一日 1 次"、"一日 2 次"、"一日 3 次"、"一日 4 次"
3. 服用说明：用法用量
4. 服用天数：数字或null

只返回 JSON，不要任何其他文字！"""
                        }
                    ]
                }
            ],
            "max_tokens": 1000
        }
        
        print(f"正在调用视觉模型进行药品识别：base_url={base_url}, model={model}")
        
        # 增加超时时间到 300 秒
        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"视觉模型完整响应：{result}")
                    
                    if result.get('choices') and len(result['choices']) > 0:
                        message = result['choices'][0]['message']
                        content = message.get('content', '')
                        
                        # 尝试解析 AI 返回的 JSON
                        try:
                            # 清理 AI 返回的内容（移除 markdown 标记）
                            content_clean = content.strip()
                            # 移除 ```json 开头
                            if content_clean.startswith('```json'):
                                content_clean = content_clean[7:]
                            # 移除 ``` 开头
                            elif content_clean.startswith('```'):
                                content_clean = content_clean[3:]
                            # 移除结尾的 ```
                            if content_clean.endswith('```'):
                                content_clean = content_clean[:-3]
                            
                            content_clean = content_clean.strip()
                            print(f"清理后的内容：{content_clean}")
                            
                            # 提取 JSON 部分
                            json_match = re.search(r'\{[\s\S]*\}', content_clean)
                            if json_match:
                                json_str = json_match.group(0)
                                print(f"提取的 JSON 字符串：{json_str}")
                                
                                ai_result = json.loads(json_str)
                                print(f"解析后的 AI 结果：{ai_result}")
                                
                                # 转换为我们的格式
                                result_obj = MedicationOCRResponse()
                                
                                # 尝试多种可能的键名
                                name_keys = ['药品名称', 'name', '药品名', '名称', '药名']
                                for key in name_keys:
                                    if ai_result.get(key):
                                        result_obj.name = str(ai_result[key]).strip()
                                        print(f"找到药品名称 (键：{key}): {result_obj.name}")
                                        break
                                
                                # 如果还是找不到，尝试直接取第一个非空值
                                if not result_obj.name:
                                    for key, value in ai_result.items():
                                        if value and isinstance(value, str) and len(value) > 0:
                                            result_obj.name = value.strip()
                                            print(f"使用备用名称 (键：{key}): {result_obj.name}")
                                            break
                                
                                # 如果还是没有，给一个默认值
                                if not result_obj.name:
                                    result_obj.name = "药品"
                                    print("使用默认名称：药品")
                                
                                # 提取其他字段
                                freq_keys = ['服用频次', 'frequency', '频次']
                                for key in freq_keys:
                                    if ai_result.get(key):
                                        result_obj.frequency = ai_result[key]
                                        break
                                
                                dosage_keys = ['服用说明', 'dosage', '用法', '说明']
                                for key in dosage_keys:
                                    if ai_result.get(key):
                                        result_obj.dosage = ai_result[key]
                                        break
                                
                                duration_keys = ['服用天数', 'duration_days', '天数']
                                for key in duration_keys:
                                    if ai_result.get(key):
                                        result_obj.duration_days = ai_result[key]
                                        break
                                
                                result_obj.raw_text = content
                                
                                # 根据频次生成时间
                                if result_obj.frequency:
                                    if result_obj.frequency == '一日 1 次':
                                        result_obj.times = ['08:00']
                                    elif result_obj.frequency == '一日 2 次':
                                        result_obj.times = ['08:00', '20:00']
                                    elif result_obj.frequency == '一日 3 次':
                                        result_obj.times = ['08:00', '12:00', '18:00']
                                    elif result_obj.frequency == '一日 4 次':
                                        result_obj.times = ['08:00', '12:00', '18:00', '22:00']
                                
                                print(f"最终返回结果：{result_obj.dict()}")
                                return result_obj
                        except Exception as e:
                            print(f"解析 AI 返回的 JSON 失败：{e}")
                            # 如果解析失败，返回空结果
                            return MedicationOCRResponse(raw_text=content, name="识别失败")
                    
                    return MedicationOCRResponse(raw_text=content, name="识别失败")
                else:
                    print(f"API 错误：{response.text}")
                    return MedicationOCRResponse(raw_text=f"API 错误：{response.status_code}", name="API 错误")
            except Exception as e:
                print(f"API 调用异常：{e}")
                import traceback
                traceback.print_exc()
                return MedicationOCRResponse(raw_text=f"API 调用异常：{str(e)}", name="网络错误")
                
    except Exception as e:
        print(f"药品说明书识别异常：{e}")
        import traceback
        traceback.print_exc()
        return MedicationOCRResponse(raw_text=f"识别异常：{str(e)}", name="系统错误")
