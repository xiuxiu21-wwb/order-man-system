#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建新闻 API 文件的脚本
"""

code = '''from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import random
from app.core.config import settings

router = APIRouter(prefix="/news", tags=["news"])

class NewsItem(BaseModel):
    id: int
    title: str
    description: str
    image: str
    time: str
    source: str

class NewsResponse(BaseModel):
    news: List[NewsItem]
    has_more: bool = False

def get_elder_friendly_images():
    return [
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop"
    ]

def get_sample_news():
    return [
        {
            "id": 1,
            "title": "春季养生小贴士：多吃这些食物对身体好",
            "description": "春季是养生的好时节，专家建议多吃新鲜蔬菜和水果，适量运动，保持良好的作息习惯。",
            "image": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop",
            "time": "2小时前",
            "source": "健康日报"
        },
        {
            "id": 2,
            "title": "老年人如何保持大脑活跃？专家给出这些建议",
            "description": "专家建议老年人多读书、下棋、学习新技能，保持社交活动，这些都有助于延缓认知衰退。",
            "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
            "time": "5小时前",
            "source": "老年健康"
        },
        {
            "id": 3,
            "title": "社区开展免费健康体检活动，欢迎老年人参加",
            "description": "本周末社区卫生服务中心将开展免费健康体检活动，包括血压、血糖、心电图等检查项目。",
            "image": "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=300&fit=crop",
            "time": "8小时前",
            "source": "社区通知"
        }
    ]

def is_elder_friendly_news(title, digest):
    elder_keywords = [
        "健康", "养生", "医疗", "医院", "医生",
        "老年", "老人", "退休", "养老",
        "社会", "民生", "政策", "福利",
        "天气", "气候", "旅游", "出行",
        "文化", "艺术", "书画", "音乐",
        "体育", "健身", "运动",
        "科技", "智能", "方便", "实用",
        "美食", "烹饪", "饮食",
        "家庭", "亲情", "子女", "孙辈"
    ]
    
    unwanted_keywords = [
        "明星", "娱乐", "八卦", "绯闻",
        "游戏", "电竞", "直播",
        "股票", "基金", "期货", "投资",
        "暴力", "犯罪", "恐怖",
        "色情", "低俗",
        "车祸", "事故", "灾难"
    ]
    
    text = (title + " " + digest).lower()
    
    for keyword in unwanted_keywords:
        if keyword in text:
            return False
    
    for keyword in elder_keywords:
        if keyword in text:
            return True
    
    return False

@router.get("/list", response_model=NewsResponse)
async def get_news_list(page: int = 1, page_size: int = 10):
    try:
        api_key = settings.NEWS_API_KEY
        api_url = settings.NEWS_API_URL
        
        images = get_elder_friendly_images()
        
        params = {
            "key": api_key,
            "type": "top"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(api_url, params=params)
            result = response.json()
            
            if result.get("reason") == "success" and result.get("result", {}).get("data"):
                news_list = result["result"]["data"]
                
                news_items = []
                for idx, item in enumerate(news_list):
                    title = item.get("title", "")
                    digest = item.get("digest", "")
                    
                    if not is_elder_friendly_news(title, digest):
                        continue
                    
                    news_items.append({
                        "id": idx + 1,
                        "title": title,
                        "description": digest,
                        "image": random.choice(images),
                        "time": item.get("mtime", ""),
                        "source": item.get("author_name", "新闻")
                    })
                
                if not news_items:
                    news_items = get_sample_news()
                
                return NewsResponse(
                    news=news_items[:page_size],
                    has_more=False
                )
            else:
                return NewsResponse(
                    news=get_sample_news(),
                    has_more=False
                )

    except Exception as e:
        print(f"新闻API错误: {e}")
        return NewsResponse(
            news=get_sample_news(),
            has_more=False
        )
'''

with open(r'app/api/news.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('✅ news.py 文件创建成功！')
