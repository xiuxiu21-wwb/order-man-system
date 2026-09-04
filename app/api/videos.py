"""Short-video feed adapter using an authorized/public feed when configured."""

from pathlib import Path
from typing import Any, Dict, List

import httpx
from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.core.config import settings

router = APIRouter(prefix="/videos", tags=["videos"])

PROJECT_DIR = Path(__file__).resolve().parents[2]
VIDEO_DIR = PROJECT_DIR / "media" / "videos"

# These files are deliberately short and low bitrate.  They make the first
# screen responsive and keep the mini-program's offline cache practical.
LOCAL_VIDEO_FEED = [
    {"id": "care-clip-01", "file": "clip-01", "title": "湖边慢步", "description": "放慢脚步，享受片刻宁静。", "source": "家护伴短片"},
    {"id": "care-clip-02", "file": "clip-02", "title": "湖光与树影", "description": "看看自然风景，放松一下眼睛。", "source": "家护伴短片"},
    {"id": "care-clip-03", "file": "clip-03", "title": "午后公园", "description": "天气合适时，出门走走也很好。", "source": "家护伴短片"},
    {"id": "care-clip-04", "file": "clip-04", "title": "绿意时光", "description": "轻松观看，记得调整舒适坐姿。", "source": "家护伴短片"},
    {"id": "care-clip-05", "file": "clip-05", "title": "城市散步", "description": "出门前带好水和常用药品。", "source": "家护伴短片"},
    {"id": "care-clip-06", "file": "clip-06", "title": "慢行一刻", "description": "步子不用快，安全最重要。", "source": "家护伴短片"},
    {"id": "care-clip-07", "file": "clip-07", "title": "沿途风景", "description": "看看身边的小美好。", "source": "家护伴短片"},
    {"id": "care-clip-08", "file": "clip-08", "title": "自在走走", "description": "活动后可以做几次舒缓呼吸。", "source": "家护伴短片"},
    {"id": "care-clip-09", "file": "clip-09", "title": "街景片刻", "description": "在家也能看看外面的生活。", "source": "家护伴短片"},
    {"id": "care-clip-10", "file": "clip-10", "title": "城市午后", "description": "看累了就暂停，休息一会儿。", "source": "家护伴短片"},
    {"id": "care-clip-11", "file": "clip-11", "title": "花开时节", "description": "颜色和花香总能带来好心情。", "source": "家护伴短片"},
    {"id": "care-clip-12", "file": "clip-12", "title": "静看花影", "description": "舒展肩颈，慢慢享受这一刻。", "source": "家护伴短片"},
]


def get_local_video_feed() -> List[Dict[str, str]]:
    """Return only clips whose video and poster have been deployed."""
    feed = []
    for item in LOCAL_VIDEO_FEED:
        name = item["file"]
        if (VIDEO_DIR / f"{name}.mp4").is_file() and (VIDEO_DIR / f"{name}.jpg").is_file():
            feed.append({
                "id": item["id"],
                "title": item["title"],
                "description": item["description"],
                "source": item["source"],
                "video_url": f"/videos/assets/{name}.mp4",
                "cover_url": f"/videos/assets/{name}.jpg",
            })
    return feed

FALLBACK_VIDEOS = [
    {"id": "wellness-1", "title": "跟着节奏做舒缓伸展", "description": "动作慢一点，身体更舒服。", "source": "家护伴精选", "video_url": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", "cover_url": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=1200&fit=crop"},
    {"id": "wellness-2", "title": "公园散步小贴士", "description": "选择平整路线，记得带水，量力而行。", "source": "家护伴精选", "video_url": "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4", "cover_url": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=1200&fit=crop"},
]


def normalize_video(item: Dict[str, Any], index: int) -> Dict[str, str]:
    return {
        "id": str(item.get("id") or item.get("video_id") or f"remote-{index}"),
        "title": str(item.get("title") or item.get("desc") or "精选短视频"),
        "description": str(item.get("description") or item.get("desc") or "适合长辈轻松观看"),
        "source": str(item.get("source") or item.get("author") or "视频精选"),
        "video_url": str(item.get("video_url") or item.get("play_url") or item.get("url") or ""),
        "cover_url": str(item.get("cover_url") or item.get("cover") or item.get("thumbnail") or ""),
    }


async def fetch_authorized_feed() -> List[Dict[str, str]]:
    feed_url = (getattr(settings, "VIDEO_FEED_API_URL", "") or "").strip()
    if not feed_url:
        return []
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(feed_url, headers={"Accept": "application/json"})
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError):
        return []
    raw_items = payload.get("videos") if isinstance(payload, dict) else payload
    if isinstance(payload, dict) and not raw_items:
        raw_items = payload.get("data")
    if not isinstance(raw_items, list):
        return []
    videos = [normalize_video(item, index) for index, item in enumerate(raw_items)]
    return [item for item in videos if item["video_url"]]


@router.get("/assets/{filename}")
async def get_video_asset(filename: str):
    """Serve the curated clips through the already-approved API domain."""
    allowed_files = {f"{item['file']}.{extension}" for item in LOCAL_VIDEO_FEED for extension in ("mp4", "jpg")}
    if filename not in allowed_files:
        return {"success": False, "message": "视频资源不存在"}

    file_path = VIDEO_DIR / filename
    if not file_path.is_file():
        return {"success": False, "message": "视频资源尚未部署"}

    media_type = "video/mp4" if filename.endswith(".mp4") else "image/jpeg"
    return FileResponse(file_path, media_type=media_type, filename=filename)


@router.get("/feed")
async def get_video_feed():
    # Restore the original remote feed first. Local clips are only a fallback,
    # otherwise every phone has to stream the same files from our small server.
    configured = await fetch_authorized_feed()
    if configured:
        return {"success": True, "data": configured, "source": "authorized_feed"}

    # 无配置时直接返回旧版远程源，不调用慢速的公共媒体搜索接口。
    return {
        "success": True,
        "data": FALLBACK_VIDEOS,
        "source": "legacy_remote_fallback",
    }
