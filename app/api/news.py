from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import random
import json
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
    # 丰富的高质量老人友好新闻池
    news_pool = [
        {
            "title": "春季养生小贴士：多吃这些食物对身体好",
            "description": "春季是养生的好时节，专家建议多吃新鲜蔬菜和水果，适量运动，保持良好的作息习惯。",
            "source": "健康日报",
            "time": "2 小时前"
        },
        {
            "title": "老年人如何保持大脑活跃？专家给出这些建议",
            "description": "专家建议老年人多读书、下棋、学习新技能，保持社交活动，这些都有助于延缓认知衰退。",
            "source": "老年健康",
            "time": "5 小时前"
        },
        {
            "title": "社区开展免费健康体检活动，欢迎老年人参加",
            "description": "本周末社区卫生服务中心将开展免费健康体检活动，包括血压、血糖、心电图等检查项目。",
            "source": "社区通知",
            "time": "8 小时前"
        },
        {
            "title": "天气预报：未来三天晴好，适合外出踏青",
            "description": "据气象部门预报，未来三天我市天气晴好，气温适中，非常适合外出踏青和户外活动。",
            "source": "气象服务",
            "time": "1 小时前"
        },
        {
            "title": "国家医保局发布新政策，老年人看病报销比例提高",
            "description": "最新医保政策出炉，退休人员住院医疗费用报销比例将达到 85% 以上，减轻老年人医疗负担。",
            "source": "民生新闻",
            "time": "3 小时前"
        },
        {
            "title": "专家提醒：春季老年人要注意预防这些疾病",
            "description": "春季气温变化大，老年人容易感冒，专家建议注意保暖，加强锻炼，提高免疫力。",
            "source": "健康时报",
            "time": "4 小时前"
        },
        {
            "title": "城市公园新增老年健身区，设施齐全免费开放",
            "description": "为满足老年人健身需求，市园林局在多个公园新增老年健身区，配备适合老年人的健身器材。",
            "source": "本地新闻",
            "time": "6 小时前"
        },
        {
            "title": "老年人学习使用智能手机，享受数字生活便利",
            "description": "社区开设老年人智能手机培训班，教授微信、网购、导航等实用技能，帮助老年人融入数字时代。",
            "source": "科技日报",
            "time": "7 小时前"
        },
        {
            "title": "营养师推荐：适合老年人的三道养生菜",
            "description": "专业营养师推荐三道适合老年人的养生菜，清淡可口又营养，有助于健康长寿。",
            "source": "美食天下",
            "time": "9 小时前"
        },
        {
            "title": "退休生活如何更精彩？这些活动值得一试",
            "description": "书法、绘画、合唱、舞蹈...越来越多的老年人参加文化活动，让退休生活更加充实精彩。",
            "source": "文化周刊",
            "time": "10 小时前"
        },
        {
            "title": "高血压患者日常饮食要注意这些",
            "description": "专家提醒，高血压患者应低盐饮食，多吃蔬菜水果，适量运动，定期监测血压。",
            "source": "医疗健康",
            "time": "11 小时前"
        },
        {
            "title": "养老金又涨了！多地公布调整方案",
            "description": "多个省市公布养老金调整方案，总体涨幅约为 5%，惠及广大退休人员。",
            "source": "财经新闻",
            "time": "12 小时前"
        }
    ]
    
    # 随机选择 6 条新闻
    selected = random.sample(news_pool, min(6, len(news_pool)))
    
    return [
        {
            "id": i + 1,
            "title": news["title"],
            "description": news["description"],
            "image": random.choice(get_elder_friendly_images()),
            "time": news["time"],
            "source": news["source"]
        }
        for i, news in enumerate(selected)
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
        
        # 随机选择新闻类型，优先选择适合老年人的分类
        # top: 头条，guonei: 国内，shehui: 社会，jiankang: 健康，tiyu: 体育，junshi: 军事
        news_types = ["top", "guonei", "shehui", "jiankang", "tiyu", "junshi"]
        selected_type = random.choice(news_types)
        
        print(f"请求新闻类型：{selected_type}")
        
        params = {
            "key": api_key,
            "type": selected_type
        }
        
        print(f"请求新闻 API: {api_url}, 参数：{params}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(api_url, params=params)
            result = response.json()
            
            print(f"新闻 API 响应状态码：{response.status_code}")
            print(f"新闻 API 响应内容：{result}")
            
            # 聚合数据 API 返回格式：{"reason":"success!","result":{"data":[...]}}
            # 或者错误格式：{"resultcode":"101","reason":"错误的请求 KEY!!!","result":null}
            reason = result.get("reason", "")
            if reason.lower().startswith("success"):
                # 尝试从 result.list 或 result.data 获取数据
                news_list = result.get("result", {}).get("list") or result.get("result", {}).get("data")
                
                if not news_list:
                    print("API 返回成功但没有数据，使用示例新闻")
                    return NewsResponse(
                        news=get_sample_news(),
                        has_more=False
                    )
                    
                print(f"获取到 {len(news_list)} 条新闻")
                
                news_items = []
                for idx, item in enumerate(news_list):
                    title = item.get("title", "")
                    # 新 API 返回 digest 或空，如果没有则用 title
                    digest = item.get("digest", "")
                    # 聚合数据可能返回多个图片字段：thumbnail_pic_s, thumbnail_str, thumbnail 等
                    thumbnail_str = item.get("thumbnail_str") or item.get("thumbnail_pic_s") or item.get("thumbnail", "")
                    
                    # 检查是否是老人友好新闻
                    if not is_elder_friendly_news(title, digest):
                        print(f"过滤新闻：{title}")
                        continue
                    
                    # 提取图片
                    image_url = random.choice(images)
                    if thumbnail_str and thumbnail_str.startswith('http'):
                        image_url = thumbnail_str
                        print(f"使用新闻图片：{image_url}")
                    
                    # 提取时间，新 API 返回 date 字段
                    time_str = item.get("date") or item.get("mtime", "刚刚")
                    # 格式化时间，从 "2026-03-11 11:49:00" 转换为 "X 小时前"
                    if time_str and len(time_str) >= 16:
                        try:
                            from datetime import datetime
                            news_time = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")
                            now = datetime.now()
                            diff_hours = int((now - news_time).total_seconds() / 3600)
                            if diff_hours < 1:
                                time_display = "刚刚"
                            elif diff_hours < 24:
                                time_display = f"{diff_hours}小时前"
                            else:
                                diff_days = diff_hours // 24
                                time_display = f"{diff_days}天前"
                        except:
                            time_display = time_str
                    else:
                        time_display = time_str
                    
                    news_items.append({
                        "id": idx + 1,
                        "title": title,
                        "description": digest if digest else title,
                        "image": image_url,
                        "time": time_display,
                        "source": item.get("author_name", "新闻")
                    })
                
                print(f"筛选后剩余 {len(news_items)} 条老人友好新闻")
                
                if not news_items:
                    print("没有合适的新闻，使用示例新闻")
                    news_items = get_sample_news()
                
                return NewsResponse(
                    news=news_items[:page_size],
                    has_more=False
                )
            else:
                # API 调用失败，检查错误原因
                reason = result.get("reason", "未知错误")
                resultcode = result.get("resultcode", "N/A")
                print(f"新闻 API 调用失败：{reason} (错误码：{resultcode})")
                print(f"请检查 API key 是否正确，以及应用是否已审核")
                print(f"使用示例新闻作为备用")
                return NewsResponse(
                    news=get_sample_news(),
                    has_more=False
                )

    except Exception as e:
        print(f"新闻 API 错误：{e}")
        import traceback
        traceback.print_exc()
        return NewsResponse(
            news=get_sample_news(),
            has_more=False
        )
