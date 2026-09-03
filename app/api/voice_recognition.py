"""火山引擎语音识别与语音合成接口。

凭据仅由服务器环境变量读取，小程序只上传录音、接收已生成的音频。
"""

import gzip
import inspect
import io
import json
import os
import struct
import uuid
import wave

import websockets
from fastapi import APIRouter, File, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field

from app.core.config import settings

router = APIRouter()

ASR_ENDPOINT = "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async"
TTS_ENDPOINT = "wss://openspeech.bytedance.com/api/v3/tts/unidirectional/stream"
SAMPLE_RATE = 16000


class VoiceResponse(BaseModel):
    success: bool
    text: str = ""
    message: str = ""


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)


def _is_configured() -> bool:
    return all((
        _setting("VOLCENGINE_SPEECH_APP_ID"),
        _setting("VOLCENGINE_SPEECH_ACCESS_TOKEN"),
    ))


def _setting(name: str, default: str = "") -> str:
    """优先读取环境变量，兼容尚未包含语音字段的旧 config.py。"""
    value = os.getenv(name)
    if value is None:
        value = getattr(settings, name, default)
    return str(value or "").strip()


def _headers(resource_id: str, is_asr: bool) -> dict[str, str]:
    result = {
        "X-Api-Access-Key": _setting("VOLCENGINE_SPEECH_ACCESS_TOKEN"),
        "X-Api-Resource-Id": resource_id,
        "X-Api-Request-Id": str(uuid.uuid4()),
    }
    if is_asr:
        result["X-Api-App-Key"] = _setting("VOLCENGINE_SPEECH_APP_ID")
        result["X-Api-Connect-Id"] = str(uuid.uuid4())
    else:
        result["X-Api-App-Id"] = _setting("VOLCENGINE_SPEECH_APP_ID")
    return result


def _socket_connect(url: str, headers: dict[str, str], max_size: int):
    """兼容服务器上 websockets 12 与当前版本。"""
    header_parameter = "additional_headers" if "additional_headers" in inspect.signature(websockets.connect).parameters else "extra_headers"
    return websockets.connect(url, **{header_parameter: headers, "max_size": max_size, "open_timeout": 20})


def _compressed_frame(header: bytes, payload: bytes) -> bytes:
    payload = gzip.compress(payload)
    return header + struct.pack(">I", len(payload)) + payload


def _parse_asr(data: bytes) -> dict:
    message_type = data[1] >> 4
    flags = data[1] & 0x0F
    compressed = (data[2] & 0x0F) == 0x01
    offset = 4
    if message_type == 0x0F:
        code = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 4
        length = struct.unpack(">I", data[offset:offset + 4])[0]
        body = data[offset:offset + length]
        if compressed or body[:2] == b"\x1f\x8b":
            body = gzip.decompress(body)
        return {"error": code, "message": body.decode("utf-8", "replace")}
    sequence = None
    if flags & 0x01:
        sequence = struct.unpack(">i", data[offset:offset + 4])[0]
        offset += 4
    length = struct.unpack(">I", data[offset:offset + 4])[0]
    offset += 4
    body = data[offset:offset + length]
    if compressed:
        body = gzip.decompress(body)
    return {"body": json.loads(body) if body else {}, "sequence": sequence, "flags": flags}


def _to_pcm(audio_data: bytes) -> bytes:
    """小程序使用 WAV 录音，火山 ASR v3 接收原始 16 位 PCM。"""
    try:
        with wave.open(io.BytesIO(audio_data), "rb") as source:
            expected = (SAMPLE_RATE, 1, 2)
            actual = (source.getframerate(), source.getnchannels(), source.getsampwidth())
            if actual != expected:
                raise ValueError("录音格式必须为 16kHz、单声道、16 位 WAV")
            return source.readframes(source.getnframes())
    except (wave.Error, EOFError) as exc:
        raise ValueError("录音文件不是有效的 WAV 格式") from exc


async def transcribe_with_volcengine(audio_data: bytes) -> str:
    pcm = _to_pcm(audio_data)
    if not pcm:
        return ""
    configuration = {
        "user": {"uid": "jiahuban-miniprogram", "platform": "WeChat"},
        "audio": {"format": "pcm", "codec": "raw", "rate": SAMPLE_RATE, "bits": 16, "channel": 1},
        "request": {"model_name": "bigmodel", "enable_itn": True, "enable_punc": True, "show_utterances": False, "result_type": "single"},
    }
    config_header = bytes([0x11, 0x10, 0x11, 0x00])
    audio_header = bytes([0x11, 0x20, 0x01, 0x00])
    final_audio_header = bytes([0x11, 0x22, 0x01, 0x00])
    final_text = ""

    async with _socket_connect(
        ASR_ENDPOINT, _headers(_setting("VOLCENGINE_ASR_RESOURCE_ID", "volc.seedasr.sauc.duration"), True), 10_000_000
    ) as socket:
        await socket.send(_compressed_frame(config_header, json.dumps(configuration, ensure_ascii=False).encode("utf-8")))
        acknowledgement = _parse_asr(await socket.recv())
        if "error" in acknowledgement:
            raise RuntimeError(f"ASR 配置被拒绝：{acknowledgement['message']}")

        # 100ms 一帧，最后一帧需使用终止标记才能收到最终识别结果。
        frame_bytes = SAMPLE_RATE * 2 // 10
        chunks = [pcm[index:index + frame_bytes] for index in range(0, len(pcm), frame_bytes)]
        for index, chunk in enumerate(chunks):
            await socket.send(_compressed_frame(final_audio_header if index == len(chunks) - 1 else audio_header, chunk))

        async for message in socket:
            response = _parse_asr(message if isinstance(message, bytes) else message.encode("latin-1"))
            if "error" in response:
                raise RuntimeError(f"ASR 服务错误：{response['message']}")
            result = response.get("body", {}).get("result")
            if isinstance(result, dict):
                final_text = result.get("text", final_text) or final_text
            elif isinstance(result, list) and result:
                final_text = result[0].get("text", final_text) or final_text
            if (response.get("sequence") or 0) < 0 or response.get("flags", 0) & 0x02:
                break
    return final_text.strip()


def _parse_tts(data: bytes) -> dict:
    message_type = data[1] >> 4
    offset = 4
    if message_type == 0x0F:
        code = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 4
        length = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 4
        return {"error": code, "message": data[offset:offset + length].decode("utf-8", "replace")}
    event = struct.unpack(">I", data[offset:offset + 4])[0]
    offset += 4
    session_length = struct.unpack(">I", data[offset:offset + 4])[0]
    offset += 4 + session_length
    payload_length = struct.unpack(">I", data[offset:offset + 4])[0]
    offset += 4
    return {"event": event, "type": message_type, "payload": data[offset:offset + payload_length]}


async def synthesize_with_volcengine(text: str) -> bytes:
    body = {
        "user": {"uid": "jiahuban-miniprogram"},
        "req_params": {
            "text": text,
            "speaker": _setting("VOLCENGINE_TTS_SPEAKER", "zh_female_shuangkuaisisi_uranus_bigtts"),
            "audio_params": {"format": "mp3", "sample_rate": 24000},
        },
    }
    json_body = json.dumps(body, ensure_ascii=False).encode("utf-8")
    request = bytes([0x11, 0x10, 0x10, 0x00]) + struct.pack(">I", len(json_body)) + json_body
    audio = bytearray()
    async with _socket_connect(
        TTS_ENDPOINT, _headers(_setting("VOLCENGINE_TTS_RESOURCE_ID", "seed-tts-2.0"), False), 20_000_000
    ) as socket:
        await socket.send(request)
        async for message in socket:
            response = _parse_tts(message if isinstance(message, bytes) else message.encode("latin-1"))
            if "error" in response:
                raise RuntimeError(f"TTS 服务错误：{response['message']}")
            if response.get("event") == 352 and response.get("type") == 0x0B:
                audio.extend(response["payload"])
            if response.get("event") == 152:
                break
    if not audio:
        raise RuntimeError("TTS 服务没有返回音频")
    return bytes(audio)


@router.post("/voice", response_model=VoiceResponse)
async def recognize_voice(file: UploadFile = File(...)):
    if not _is_configured():
        return VoiceResponse(success=False, message="语音服务尚未在服务器配置，请联系管理员。")
    try:
        audio_data = await file.read()
        if not audio_data:
            return VoiceResponse(success=False, message="没有收到录音，请再说一次。")
        text = await transcribe_with_volcengine(audio_data)
        return VoiceResponse(success=True, text=text) if text else VoiceResponse(success=False, message="我没有听清楚，请您再说一遍。")
    except ValueError as exc:
        return VoiceResponse(success=False, message=str(exc))
    except Exception:
        # 不将第三方错误细节和认证信息返回给小程序。
        return VoiceResponse(success=False, message="语音识别出了点问题，请稍后再试。")


@router.post("/voice/tts")
async def text_to_speech(payload: TTSRequest):
    if not _is_configured():
        raise HTTPException(status_code=503, detail="语音服务尚未在服务器配置")
    try:
        audio = await synthesize_with_volcengine(payload.text.strip())
        return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "no-store"})
    except Exception:
        raise HTTPException(status_code=502, detail="语音合成暂时不可用")
