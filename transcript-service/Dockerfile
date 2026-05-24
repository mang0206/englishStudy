FROM python:3.11-slim

WORKDIR /app

# 빌드 의존성 최소화 (yt-dlp는 순수 파이썬이라 추가 컴파일러 불필요)
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8000

# 단일 워커로 시작 (1인 사용)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
