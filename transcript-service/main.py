"""
YouTube 영상에서 챕터 정보와 챕터별 자막을 추출하는 마이크로서비스.
"""
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import yt_dlp
import json
import re

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("transcript-service")

app = FastAPI(title="Transcript Service", version="1.0")


class Chapter(BaseModel):
    title: str
    startSec: float
    endSec: Optional[float] = None
    transcript: str


class TranscriptResponse(BaseModel):
    videoId: str
    title: Optional[str] = None
    chapters: list[Chapter]


@app.get("/health")
def health():
    return {"status": "ok"}

def clean_transcript_text(text: str) -> str:
    """자막 텍스트에서 노이즈 제거."""
    # [music], [applause], [laughter] 등 대괄호 지문 제거
    text = re.sub(r'\[[^\]]*\]', '', text)
    # >> 화자 표시 제거
    text = re.sub(r'>>\s*', '', text)
    # 연속 공백 정리
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

@app.get("/transcript", response_model=TranscriptResponse)
def get_transcript(videoId: str):
    log.info(f"Request: videoId={videoId}")

    # 1. 영상 메타데이터, 챕터 추출 및 자막 추출
    try:
        ydl_opts = {
            "quiet": True,
            "skip_download": True,
            "no_warnings": True,
            "youtube_include_dash_manifest": False,
            "youtube_include_hls_manifest": False,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": ["en", "en-US", "en-GB"],
            "extractor_args": {
                "youtube": {
                    "player_client": ["web_safari", "mweb"],
                }
            },
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(
                f"https://www.youtube.com/watch?v={videoId}",
                download=False,
                process=False,
            )
            if info is None:
                raise HTTPException(status_code=400, detail="영상 정보를 추출할 수 없습니다.")
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"yt-dlp failed: {e}")
        raise HTTPException(status_code=400, detail=f"영상 메타데이터를 가져올 수 없습니다: {str(e)[:200]}")

    video_title = info.get("title", "")
    chapters_raw = info.get("chapters") or []

    if not chapters_raw:
        raise HTTPException(status_code=400, detail="이 영상에는 챕터 정보가 없습니다.")

    # 2. 자막 가져오기 (수동 자막 우선, 없으면 자동 자막)
    subs = info.get('subtitles', {})
    auto_subs = info.get('automatic_captions', {})

    selected_sub = None
    transcript_type = None
    lang_found = None

    for lang in ["en", "en-US", "en-GB"]:
        if lang in subs:
            selected_sub = subs[lang]
            transcript_type = "manual"
            lang_found = lang
            break

    if not selected_sub:
        for lang in ["en", "en-US", "en-GB"]:
            if lang in auto_subs:
                selected_sub = auto_subs[lang]
                transcript_type = "auto"
                lang_found = lang
                break

    if not selected_sub:
        # 아무 수동 자막
        if subs:
            lang_found = list(subs.keys())[0]
            selected_sub = subs[lang_found]
            transcript_type = "manual (non-English)"

    if not selected_sub:
        raise HTTPException(status_code=400, detail="이 영상에는 영어 자막이 없습니다.")

    log.info(f"Using {transcript_type} transcript: {lang_found}")

    json3_url = next((f['url'] for f in selected_sub if f.get('ext') == 'json3'), None)
    if not json3_url:
        # json3 포맷이 없으면 json1 등 다른 포맷이 있는지 확인 (일반적으로 yt-dlp가 json3로 제공)
        json3_url = selected_sub[0]['url'] if selected_sub else None

    if not json3_url:
        raise HTTPException(status_code=400, detail="자막 URL을 찾을 수 없습니다.")

    try:
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        })
        resp = session.get(json3_url, timeout=10)
        resp.raise_for_status()

        data = resp.json()
        events = data.get('events', [])

        transcript = []
        for ev in events:
            if 'segs' in ev:
                text = "".join([seg.get('utf8', '') for seg in ev['segs']])
                if text.strip() != "":
                    start = ev.get('tStartMs', 0) / 1000.0
                    duration = ev.get('dDurationMs', 0) / 1000.0
                    transcript.append({"text": text, "start": start, "duration": duration})

        log.info(f"Transcript fetched: {len(transcript)} segments")

    except requests.exceptions.RequestException as e:
        log.error(f"Failed to fetch subtitle URL: {e}")
        raise HTTPException(status_code=500, detail=f"자막을 가져오는 중 오류: {str(e)[:200]}")
    except json.JSONDecodeError as e:
        log.error(f"Failed to parse subtitle JSON: {e}")
        raise HTTPException(status_code=500, detail="자막 데이터를 해석할 수 없습니다.")
    except Exception as e:
        log.error(f"transcript fetch failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"자막을 가져오는 중 오류: {str(e)[:200]}")

    # 3. 챕터별 자막 슬라이싱
    # yt-dlp가 end_time을 안 채워주는 경우가 많아서, 다음 챕터의 start_time으로 채워준다.
    normalized_chapters = []
    for idx, ch in enumerate(chapters_raw):
        start = float(ch.get("start_time", 0))
        end = ch.get("end_time")
        if end is None and idx + 1 < len(chapters_raw):
            end = chapters_raw[idx + 1].get("start_time")
        end = float(end) if end is not None else None
        normalized_chapters.append({
            "title": ch.get("title", "(제목 없음)"),
            "start": start,
            "end": end,
        })

    chapters = []
    for ch in normalized_chapters:
        start = ch["start"]
        end = ch["end"]

        segments = []
        for seg in transcript:
            seg_start = seg["start"]
            if seg_start < start:
                continue
            if end is not None and seg_start >= end:
                continue
            segments.append(seg["text"].strip())

        cleaned = clean_transcript_text(" ".join(segments))
        log.info(f"  Chapter '{ch['title']}' [{start}~{end}]: {len(segments)} segments, {len(cleaned)} chars")

        chapters.append(Chapter(
            title=ch["title"],
            startSec=start,
            endSec=end,
            transcript=cleaned,
        ))

    log.info(f"Done: videoId={videoId}, chapters={len(chapters)}")
    return TranscriptResponse(
        videoId=videoId,
        title=video_title,
        chapters=chapters,
    )