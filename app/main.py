from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import users, conversations, medications, locations, alerts, image_recognition, weather, verify_code, bindings, news, admin

app = FastAPI(
    title="家护伴",
    description="为老人提供陪伴、监测和安全保障的智能系统",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
app.include_router(users.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(medications.router, prefix="/api")
app.include_router(locations.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(image_recognition.router, prefix="/api")
app.include_router(weather.router, prefix="/api")
app.include_router(verify_code.router, prefix="/api")
app.include_router(bindings.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "家护伴 API", "docs": "/docs"}

@app.get("/api/test")
def test_api():
    return {"message": "API is working"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
