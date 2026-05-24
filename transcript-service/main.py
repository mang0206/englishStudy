"""
YouTube 영상에서 챕터 정보와 챕터별 자막을 추출하는 마이크로서비스.
"""
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import yt_dlp
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)

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


@app.get("/transcript", response_model=TranscriptResponse)
def get_transcript(videoId: str):
    log.info(f"Request: videoId={videoId}")

    # 1. 영상 메타데이터 + 챕터 추출 (포맷 처리 스킵)
    try:
        ydl_opts = {
            "quiet": True,
            "skip_download": True,
            "no_warnings": True,
            "youtube_include_dash_manifest": False,
            "youtube_include_hls_manifest": False,
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
    try:
        # 브라우저 User-Agent로 세션 생성 → 봇 감지 우회
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        })
        ytt_api = YouTubeTranscriptApi(http_client=session)
        transcript_list = ytt_api.list(videoId)

        # 진단용 로깅
        available = [(t.language_code, "manual" if not t.is_generated else "auto") for t in transcript_list]
        log.info(f"Available transcripts: {available}")

        selected = None

        # 우선순위 1: 영어 수동 자막
        try:
            selected = transcript_list.find_manually_created_transcript(["en", "en-US", "en-GB"])
            log.info(f"Using manual transcript: {selected.language_code}")
        except NoTranscriptFound:
            pass

        # 우선순위 2: 영어 자동 자막
        if selected is None:
            try:
                selected = transcript_list.find_generated_transcript(["en", "en-US", "en-GB"])
                log.info(f"Using auto-generated transcript: {selected.language_code}")
            except NoTranscriptFound:
                pass

        # 우선순위 3: 아무 수동 자막
        if selected is None:
            for t in transcript_list:
                if not t.is_generated:
                    selected = t
                    log.info(f"Using non-English manual transcript: {t.language_code}")
                    break

        if selected is None:
            raise HTTPException(status_code=400, detail="이 영상에는 영어 자막이 없습니다.")

        try:
            fetched = selected.fetch()
            transcript = fetched.to_raw_data()
            log.info(f"Transcript fetched: {len(transcript)} segments")
        except Exception as fetch_err:
            log.error(f"fetch() failed: {type(fetch_err).__name__}: {fetch_err}")
            # 자막 URL을 직접 호출해서 응답 확인
            try:
                # 1.x 버전에서 자막 URL 추출
                raw_url = getattr(selected, '_url', None) or str(selected)
                log.info(f"Trying direct fetch from: {raw_url[:200]}")
                resp = session.get(raw_url, timeout=10)
                log.info(f"Direct fetch status={resp.status_code}, len={len(resp.text)}")
                log.info(f"Response preview: {resp.text[:500]}")
            except Exception as direct_err:
                log.error(f"Direct fetch failed: {direct_err}")
            raise fetch_err
    except TranscriptsDisabled:
        log.warning("Transcripts disabled")
        raise HTTPException(status_code=400, detail="이 영상은 자막이 비활성화되어 있습니다.")
    except NoTranscriptFound:
        log.warning("No transcript found")
        raise HTTPException(status_code=400, detail="이 영상에는 자막이 없습니다.")
    except VideoUnavailable:
        log.warning("Video unavailable")
        raise HTTPException(status_code=400, detail="영상에 접근할 수 없습니다.")
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"transcript fetch failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"자막을 가져오는 중 오류: {str(e)[:200]}")

    # 3. 챕터별 자막 슬라이싱
    chapters = []
    for ch in chapters_raw:
        start = float(ch.get("start_time", 0))
        end = ch.get("end_time")
        end = float(end) if end is not None else None

        segments = []
        for seg in transcript:
            seg_start = seg["start"]
            if seg_start < start:
                continue
            if end is not None and seg_start >= end:
                continue
            segments.append(seg["text"].strip())

        chapters.append(Chapter(
            title=ch.get("title", "(제목 없음)"),
            startSec=start,
            endSec=end,
            transcript=" ".join(segments),
        ))

    log.info(f"Done: videoId={videoId}, chapters={len(chapters)}")
    return TranscriptResponse(
        videoId=videoId,
        title=video_title,
        chapters=chapters,
    )