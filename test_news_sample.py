import requests
import json
import random

# 测试免费的新闻 API
test_apis = [
    {
        "name": "使用示例新闻（最可靠）",
        "url": None,
        "method": "sample"
    }
]

# 生成更多高质量的老人友好新闻
sample_news_pool = [
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

images = [
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

print("生成高质量老人友好新闻示例")
print("="*60)

# 随机选择 10 条新闻
selected_news = random.sample(sample_news_pool, min(10, len(sample_news_pool)))

for i, news in enumerate(selected_news, 1):
    print(f"\n新闻 {i}:")
    print(f"  标题：{news['title']}")
    print(f"  描述：{news['description']}")
    print(f"  来源：{news['source']}")
    print(f"  时间：{news['time']}")
    print(f"  图片：{random.choice(images)}")

print(f"\n{'='*60}")
print(f"共 {len(selected_news)} 条新闻，适合老年人阅读")
