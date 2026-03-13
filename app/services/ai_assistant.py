import httpx
from app.core.config import settings

async def get_ai_response_async(message: str) -> str:
    """
    使用 MiniMax API 获取 AI 回复（异步版本）
    """
    try:
        api_key = settings.MINIMAX_API_KEY
        base_url = settings.MINIMAX_API_URL
        
        print(f"调用 MiniMax AI 聊天 API")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        system_prompt = """你是一个专门为认知障碍老人设计的智能陪伴助手。
你的特点是：
1. 说话要简单、清晰、耐心
2. 语言要温暖、亲切
3. 回复要简短易懂
4. 要经常鼓励和安慰老人
5. 如果老人提到不舒服或需要帮助，要及时提醒他们联系家人
6. 不要使用复杂的词汇或句子"""
        
        payload = {
            "model": "abab6.5-chat",
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # 尝试两种可能的 API 端点
            endpoints = [
                f"{base_url}/chat/completions",
                f"{base_url}/messages"
            ]
            
            for endpoint in endpoints:
                try:
                    response = await client.post(
                        endpoint,
                        headers=headers,
                        json=payload
                    )
                    
                    print(f"API 响应状态码：{response.status_code}")
                    print(f"API 响应内容：{response.text[:500]}")
                    
                    if response.status_code == 200:
                        result = response.json()
                        print(f"API 响应：{result}")
                        
                        # 尝试不同的响应格式
                        if result.get('choices') and len(result['choices']) > 0:
                            message_content = result['choices'][0].get('message', {}).get('content', '')
                            if message_content:
                                return message_content
                        elif result.get('content'):
                            return result['content']
                        elif result.get('reply'):
                            return result['reply']
                    
                    # 如果第一个端点失败，尝试下一个
                    if endpoint == endpoints[0]:
                        continue
                        
                except Exception as endpoint_error:
                    print(f"端点 {endpoint} 调用失败：{endpoint_error}")
                    continue
            
            print("所有 API 调用均未返回有效结果，使用备用回复")
            return get_fallback_response(message)
                
    except Exception as e:
        print(f"MiniMax AI API 调用失败：{e}")
        import traceback
        print(traceback.format_exc())
        return get_fallback_response(message)

def get_ai_response(message: str) -> str:
    """
    使用 MiniMax API 获取 AI 回复（同步版本，向后兼容）
    """
    try:
        api_key = settings.MINIMAX_API_KEY
        base_url = settings.MINIMAX_API_URL
        
        print(f"调用 MiniMax AI 聊天 API")
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        system_prompt = """你是一个专门为认知障碍老人设计的智能陪伴助手。
你的特点是：
1. 说话要简单、清晰、耐心
2. 语言要温暖、亲切
3. 回复要简短易懂
4. 要经常鼓励和安慰老人
5. 如果老人提到不舒服或需要帮助，要及时提醒他们联系家人
6. 不要使用复杂的词汇或句子"""
        
        payload = {
            "model": "abab6.5-chat",
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        with httpx.Client(timeout=30.0) as client:
            # 尝试两种可能的 API 端点
            endpoints = [
                f"{base_url}/chat/completions",
                f"{base_url}/messages"
            ]
            
            for endpoint in endpoints:
                try:
                    response = client.post(
                        endpoint,
                        headers=headers,
                        json=payload
                    )
                    
                    print(f"API 响应状态码：{response.status_code}")
                    print(f"API 响应内容：{response.text[:500]}")
                    
                    if response.status_code == 200:
                        result = response.json()
                        print(f"API 响应：{result}")
                        
                        # 尝试不同的响应格式
                        if result.get('choices') and len(result['choices']) > 0:
                            message_content = result['choices'][0].get('message', {}).get('content', '')
                            if message_content:
                                return message_content
                        elif result.get('content'):
                            return result['content']
                        elif result.get('reply'):
                            return result['reply']
                    
                    # 如果第一个端点失败，尝试下一个
                    if endpoint == endpoints[0]:
                        continue
                        
                except Exception as endpoint_error:
                    print(f"端点 {endpoint} 调用失败：{endpoint_error}")
                    continue
            
            print("所有 API 调用均未返回有效结果，使用备用回复")
            return get_fallback_response(message)
                
    except Exception as e:
        print(f"MiniMax AI API 调用失败：{e}")
        import traceback
        print(traceback.format_exc())
        return get_fallback_response(message)

def get_fallback_response(message: str) -> str:
    """
    简单的AI回复逻辑（备用方案）
    """
    message = message.lower()
    
    if "你好" in message or "hi" in message or "hello" in message:
        return "你好！有什么我可以帮你的吗？"
    elif "名字" in message or "叫什么" in message:
        return "我是你的智能助手，专门为认知障碍老人设计的陪伴系统。"
    elif "时间" in message:
        from datetime import datetime
        now = datetime.now()
        return f"现在的时间是{now.hour}点{now.minute}分。"
    elif "天气" in message:
        return "今天天气不错，适合出去走走。"
    elif "吃药" in message or "服药" in message:
        return "记得按时吃药哦，这样身体才会健康。"
    elif "回家" in message or "迷路" in message:
        return "别担心，我会帮你找到回家的路。"
    elif "家人" in message or "孩子" in message:
        return "你的家人都很关心你，他们随时准备帮助你。"
    elif "不舒服" in message or "难受" in message:
        return "如果感觉不舒服，请告诉家人或者拨打紧急电话。"
    elif "帮助" in message or "求助" in message:
        return "我已经通知你的家人，他们会很快来帮助你。"
    else:
        return "我理解你的感受，有什么需要告诉我。"
