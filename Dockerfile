# ElSpa Backend - Render용 간단한 Docker 이미지
FROM python:3.11-slim

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 코드 복사
COPY main.py .

# 환경 변수
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV ENVIRONMENT=production

# 포트 노출
EXPOSE 8000

# 시작 명령
CMD ["python", "main.py"]
